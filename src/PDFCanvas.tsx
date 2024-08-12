import { KonvaEventObject } from 'konva/lib/Node';
import React, { TouchEvent, useEffect, useRef, useState } from 'react';
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Rect,
  Text,
  Line,
  Transformer,
} from 'react-konva';
import { pdfjs } from 'react-pdf';
import { PDFDocument } from 'pdf-lib';
import { Stage as StageType } from 'konva/lib/Stage';
import { Transformer as TransformerType } from 'konva/lib/shapes/Transformer';
import * as pdfjsLib from 'pdfjs-dist';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

type rectType = {
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  id: string;
};

type TextType = {
  x: number;
  y: number;
  text: string;
  fontSize: number;
  id: string;
};

type ImageType = {
  x: number;
  y: number;
  src: string;
  id: string;
  width?: number;
  height?: number;
};

const PDFCanvas = ({ pdfUrl }: { pdfUrl: string }) => {
  const [numPages, setNumPages] = React.useState<number | null>(1);
  const [images, setImages] = React.useState<(HTMLImageElement | undefined)[]>(
    []
  );
  const [rectangles, setRectangles] = React.useState<rectType[]>([]);
  const [textObjects, setTextObjects] = React.useState<TextType[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [imagesObjects, setImagesObjects] = React.useState<ImageType[]>([]);
  const stageRef = useRef<StageType | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [drawings, setDrawings] = useState<
    {
      tool: string;
      points: number[];
      color: string;
      strokeWidth: number;
    }[]
  >([]);
  const [canvasDimensions, setCanvasDimensions] = useState({
    width: 800,
    height: 600,
  });

  const [tool, setTool] = useState<'pen' | 'eraser' | ''>('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [pinColor, setPinColor] = useState('#000000');
  const [selectedId, selectShape] = React.useState<string | null>(null);
  const [strokeWidth, setStrokeWidth] = useState(2);
  const isMobileDrawing = useRef(false);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const saveAsPDF = async () => {
    await selectShape(null);
    const stage = stageRef.current;
    const canvas = stage?.toCanvas();
    if (!canvas) {
      return;
    }
    const imgData = canvas?.toDataURL('image/jpeg');

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([canvas.width, canvas.height]);
    const img = await pdfDoc.embedJpg(imgData);
    page.drawImage(img, {
      x: 0,
      y: 0,
      width: canvas.width,
      height: canvas.height,
    });

    const pdfBytes = await pdfDoc.save();
    // Save to the database or download
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'edited.pdf';
    link.click();
  };

  useEffect(() => {
    const fetchPDF = async () => {
      const loadingTask = pdfjs.getDocument(
        'https://pdfobject.com/pdf/sample.pdf'
      );
      const pdf = await loadingTask.promise;
      setNumPages(pdf.numPages);
      const imageUrls = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1 });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        canvas.height = viewport.height;
        const width =
          viewport.width > window.innerWidth
            ? window.innerWidth
            : viewport.width;
        canvas.width = width;

        const renderContext = {
          canvasContext: context,
          viewport,
        };
        await page.render(renderContext).promise;
        imageUrls.push(canvas.toDataURL());
        // setCanvasDimensions({ width: viewport.width, height: viewport.height });
      }

      setImageUrls(imageUrls);
    };

    fetchPDF();
  }, [pdfUrl]);

  const loadImage = async (url: string) => {
    const image = new Image();
    image.src = url;
    return image;
  };

  const loadImages = async () => {
    const loadedImages = await Promise.all(
      imageUrls.map((url) => loadImage(url))
    );
    setImages(loadedImages);
  };
  useEffect(() => {
    loadImages();
    if (imageUrls.length > 0) {
    }
  }, [imageUrls]);

  const trRef = useRef<TransformerType>(null);
  const handleMouseDown = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (tool === 'pen') {
      setIsDrawing(true);
      const pos = e.target.getStage()?.getPointerPosition();
      if (pos) {
        setDrawings([
          ...drawings,
          {
            tool,
            points: [pos.x, pos.y],
            color: pinColor,
            strokeWidth,
            type: tool,
          },
        ]);
      }
    } else if (tool === 'eraser') {
      setIsDrawing(true);
      const pos = e.target.getStage()?.getPointerPosition();
      if (pos) {
        setDrawings([
          ...drawings,
          {
            tool,
            points: [pos.x, pos.y],
            color: 'white',
            strokeWidth: 20,
            type: tool,
          },
        ]);
      }
    }
  };

  const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    if (!isDrawing) return;

    const stage = e.target.getStage();
    const point = stage?.getPointerPosition();
    let lastLine = drawings[drawings.length - 1];
    if (point) {
      lastLine.points = lastLine.points.concat([point.x, point.y]);
      drawings.splice(drawings.length - 1, 1, lastLine);
      setDrawings(drawings.concat());
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };
  const addRectangle = () => {
    const newRect = {
      x: 10,
      y: 10,
      width: 100,
      height: 100,
      fill: 'red',
      id: `rect${rectangles.length + 1}`,
    };
    setRectangles([...rectangles, newRect]);
  };

  const addText = () => {
    const newText = {
      x: 10,
      y: 10,
      text: 'Editable Text',
      fontSize: 20,
      id: `text${textObjects.length + 1}`,
    };
    setTextObjects([...textObjects, newText]);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTool('');
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      if (!reader.result) return;

      const newImage: ImageType = {
        x: 10,
        y: 10,
        src: reader.result as string,
        id: `img${imagesObjects.length + 1}`,
        width: 100,
        height: 100,
      };

      setImagesObjects([...imagesObjects, newImage]);
    };
  };
  const handleTransform = (e: any, index: number) => {
    const node = e.target;
    const newImagesObjects = imagesObjects.slice();
    newImagesObjects[index] = {
      ...newImagesObjects[index],
      x: node.x(),
      y: node.y(),
      width: node.width(),
      height: node.height(),
    };
    setImagesObjects(newImagesObjects);
  };

  const loadPdfDimensions = async (pdfUrl: string) => {
    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1); // Get the first page (or any other page)
    const viewport = page.getViewport({ scale: 1 });
    // Set canvas dimensions to match the PDF page dimensions
    const width =
      viewport.width > window.innerWidth ? window.innerWidth : viewport.width;
    setCanvasDimensions({ width, height: viewport.height });
  };
  const handleSelect = (e: KonvaEventObject<MouseEvent>) => {
    selectShape(e.target.id());
  };

  const handleTouchStart = (e: KonvaEventObject<globalThis.TouchEvent>) => {
    isMobileDrawing.current = true;
    const pos = e.target.getStage()?.getPointerPosition();
    if (pos) {
      if (tool === 'pen') {
        setDrawings([
          ...drawings,
          {
            tool,
            points: [pos.x, pos.y],
            color: pinColor,
            strokeWidth,
          },
        ]);
      } else if (tool === 'eraser') {
        setDrawings([
          ...drawings,
          {
            tool,
            points: [pos.x, pos.y],
            color: 'white',
            strokeWidth: 20,
          },
        ]);
      }
    }
  };

  const handleTouchMove = (e: KonvaEventObject<globalThis.TouchEvent>) => {
    if (!isMobileDrawing.current || !tool) {
      return;
    }
    const stage = e.target.getStage();
    const point = stage?.getPointerPosition();
    const lastLine = drawings[drawings.length - 1];
    if (lastLine && point) {
      lastLine.points = lastLine.points.concat([point.x, point.y]);
      setDrawings([...drawings.slice(0, -1), lastLine]);
    }
  };

  const handleTouchEnd = () => {
    isMobileDrawing.current = false;
  };
  const handleTextClick = (id: string, text: string, x: number, y: number) => {
    setSelectedTextId(id);
    setEditText(text);
    setIsEditing(true);

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'absolute';
    textarea.style.top = `${
      y + (stageRef.current?.container()?.offsetTop ?? 0)
    }px`;
    textarea.style.left = `${
      x + (stageRef.current?.container()?.offsetLeft ?? 0)
    }px`;
    textarea.style.fontSize = '20px';
    textarea.style.border = 'none';
    textarea.style.padding = '0';
    textarea.style.margin = '0';
    textarea.style.overflow = 'hidden';
    textarea.style.background = 'none';
    textarea.style.outline = 'none';
    textarea.style.resize = 'none';
    textarea.style.transformOrigin = 'left top';
    textarea.style.lineHeight = '1';
    textarea.style.height = 'auto';
    textarea.style.minHeight = '1em';
    textarea.style.width = `${text.length * 10}px`; // Estimate width based on text length
    textarea.style.color = 'black';

    document.body.appendChild(textarea);
    textarea.focus();

    textarea.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        finishEditing(id, textarea.value);
      } else if (e.key === 'Escape') {
        cancelEditing();
      }
    });

    textarea.addEventListener('blur', function () {
      finishEditing(id, textarea.value);
    });
  };

  const finishEditing = (id: string, newText: string) => {
    setIsEditing(false);
    setTextObjects(
      textObjects.map((textObj) =>
        textObj.id === id ? { ...textObj, text: newText } : textObj
      )
    );
    document.body.removeChild(
      document.querySelector('textarea') as HTMLTextAreaElement
    );
    setSelectedTextId(null);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    document.body.removeChild(
      document.querySelector('textarea') as HTMLTextAreaElement
    );
    setSelectedTextId(null);
  };
  const handleDragEnd = (id: string, newX: number, newY: number) => {
    setTextObjects(
      textObjects.map((textObj) =>
        textObj.id === id ? { ...textObj, x: newX, y: newY } : textObj
      )
    );
  };
  useEffect(() => {
    if (trRef.current && selectedId) {
      const selectedNode = stageRef.current?.findOne(`#${selectedId}`);
      if (selectedNode) {
        trRef.current?.nodes([selectedNode]);
        trRef.current?.getLayer()?.batchDraw();
      }
    }
  }, [selectedId]);

  useEffect(() => {
    loadPdfDimensions('https://pdfobject.com/pdf/sample.pdf'); // Load PDF dimensions from the given URL
  }, []);

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <button onClick={() => setTool('pen')}>Pen</button>
        <button onClick={() => setTool('eraser')}>Eraser</button>
        <button
          onClick={() => setDrawings((prev) => prev.slice(0, prev.length - 1))}
        >
          undo
        </button>
        <input
          type='color'
          onChange={(e) => setPinColor(e.target.value)}
          value={pinColor}
        />
        <input
          type='range'
          onChange={(e) => setStrokeWidth(4 * (e.target.valueAsNumber / 100))}
        />
        <button onClick={() => setTool('eraser')}>Eraser</button>
        <button
          onClick={() => {
            addRectangle();
            setTool('');
          }}
        >
          addRectangle
        </button>
        <button
          onClick={() => {
            addText();
            setTool('');
          }}
        >
          addText
        </button>
        <input type='file' onChange={handleImageUpload} accept='image/*' />
      </div>
      <Stage
        width={canvasDimensions.width}
        height={canvasDimensions.height}
        ref={stageRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'none' }}
      >
        <Layer>
          {images.map((image, index) => (
            <KonvaImage key={index} image={image} />
          ))}
        </Layer>
        <Layer>
          {rectangles.map((rect, i) => (
            <Rect
              key={i}
              {...rect}
              draggable
              onClick={() => selectShape(rect.id)}
              onTap={() => selectShape(rect.id)}
            />
          ))}
          {textObjects.map(
            (text) =>
              // <Text
              //   key={i}
              //   {...text}
              //   draggable
              //   onClick={() => selectShape(text.id)}
              //   onTap={() => selectShape(text.id)}
              // />
              selectedTextId !== text.id && (
                <Text
                  key={text.id}
                  text={text.text}
                  x={text.x}
                  y={text.y}
                  fontSize={20}
                  draggable
                  onDragEnd={(e) =>
                    handleDragEnd(text.id, e.target.x(), e.target.y())
                  }
                  onClick={() =>
                    handleTextClick(text.id, text.text, text.x, text.y)
                  }
                  onTap={() =>
                    handleTextClick(text.id, text.text, text.x, text.y)
                  }
                />
              )
          )}
          {imagesObjects.map((img, i) => {
            const image = document.createElement('img');
            image.src = img.src;
            return (
              <React.Fragment key={img.id}>
                <KonvaImage
                  key={i}
                  image={image}
                  {...img}
                  draggable
                  onClick={handleSelect}
                  onTap={handleSelect}
                  onTransformEnd={(e) => handleTransform(e, i)}
                />
                {selectedId === img.id && (
                  <Transformer
                    ref={trRef}
                    boundBoxFunc={(oldBox, newBox) => {
                      // Limit resize to a minimum size
                      if (newBox.width < 50 || newBox.height < 50) {
                        return oldBox;
                      }
                      return newBox;
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </Layer>
        <Layer>
          {drawings.map((drawing, i) => (
            <Line
              key={i}
              points={drawing.points}
              stroke={drawing.color}
              strokeWidth={drawing.strokeWidth}
              tension={0.5}
              lineCap='round'
            />
          ))}
        </Layer>
      </Stage>
      <button onClick={saveAsPDF}>Save as PDF</button>
    </>
  );
};

export default PDFCanvas;
