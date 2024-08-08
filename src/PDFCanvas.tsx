import { KonvaEventObject } from 'konva/lib/Node';
import React, { useEffect, useRef, useState } from 'react';
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Rect,
  Text,
  Line,
  KonvaNodeComponent,
} from 'react-konva';
import { pdfjs } from 'react-pdf';
import { PDFDocument } from 'pdf-lib';
import html2canvas from 'html2canvas';
import { Stage as StageType } from 'konva/lib/Stage';

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
};

const PDFCanvas = ({ pdfUrl }: { pdfUrl: string }) => {
  const [numPages, setNumPages] = React.useState<number | null>(1);
  const [images, setImages] = React.useState<(HTMLImageElement | undefined)[]>(
    []
  );
  const [rectangles, setRectangles] = React.useState<rectType[]>([]);
  const [textObjects, setTextObjects] = React.useState<TextType[]>([]);
  const [imagesObjects, setImagesObjects] = React.useState<ImageType[]>([]);
  const stageRef = useRef<StageType | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [drawings, setDrawings] = useState<
    { tool: string; points: number[] }[]
  >([]);
  const [tool, setTool] = useState('pen');
  const [isDrawing, setIsDrawing] = useState(false);

  const [selectedId, selectShape] = React.useState<string | null>(null);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const saveAsPDF = async () => {
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
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport,
        };
        await page.render(renderContext).promise;
        imageUrls.push(canvas.toDataURL());
      }

      setImageUrls(imageUrls);
    };

    fetchPDF();
  }, [pdfUrl]);

  const loadImage = async (url: string) => {
    const image = document.createElement('img');
    image.src = url;
    // const [image] = useImage(url);
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

  // const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
  //   // Deselect when clicked on empty area
  //   if (e.target === e.target.getStage()) {
  //     selectShape(null);
  //     return;
  //   }
  // };

  const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    if (tool === 'pen') {
      setIsDrawing(true);
      const pos = e.target.getStage()?.getPointerPosition();
      if (pos) {
        setDrawings([...drawings, { tool, points: [pos.x, pos.y] }]);
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
  // useEffect(() => {
  //   const renderPDFPages = async () => {
  //     const imagesArray = [];
  //     const loadingTask = pdfjs.getDocument(
  //       'https://pdfobject.com/pdf/sample.pdf'
  //     );
  //     const pdf = await loadingTask.promise;
  //     if (!numPages) {
  //       return;
  //     }
  //     for (let i = 1; i <= numPages; i++) {
  //       const canvas = document.createElement('canvas');
  //       const page = await pdf.getPage(i);
  //       const viewport = page.getViewport({ scale: 1.5 });
  //       const context = canvas.getContext('2d')!;
  //       canvas.height = viewport.height;
  //       canvas.width = viewport.width;

  //       const renderContext = {
  //         canvasContext: context,
  //         viewport: viewport,
  //       };
  //       if (!renderContext.canvasContext) {
  //         return;
  //       }
  //       await page.render(renderContext).promise;
  //       imagesArray.push(canvas.toDataURL());
  //     }
  //     setImages(imagesArray);
  //   };
  //   if(numPages)renderPDFPages();
  // }, [numPages, pdfUrl]);
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

  const addImage = (imageUrl: string) => {
    const newImage = {
      x: 10,
      y: 10,
      src: imageUrl,
      id: `img${images.length + 1}`,
    };
    setImagesObjects([...imagesObjects, newImage]);
  };

  return (
    <>
      <button onClick={() => setTool('pen')}>Pen</button>
      <button onClick={() => addRectangle()}>addRectangle</button>
      <button onClick={() => addText()}>addText</button>
      <button
        onClick={() => addImage('https://freesvg.org/img/1286146771.png')}
      >
        addImage
      </button>
      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        ref={stageRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
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
          {textObjects.map((text, i) => (
            <Text
              key={i}
              {...text}
              draggable
              onClick={() => selectShape(text.id)}
              onTap={() => selectShape(text.id)}
            />
          ))}
          {imagesObjects.map((img, i) => {
            const image = document.createElement('img');
            image.src = img.src;
            return (
              <KonvaImage
                key={i}
                image={image}
                {...img}
                draggable
                onClick={() => selectShape(img.id)}
                onTap={() => selectShape(img.id)}
              />
            );
          })}
        </Layer>
        <Layer>
          {drawings.map((drawing, i) => (
            <Line
              key={i}
              points={drawing.points}
              stroke='black'
              strokeWidth={2}
              tension={0.5}
              lineCap='round'
            />
          ))}
          {/* {texts.map((text, i) => (
                        <Text key={i} x={text.x} y={text.y} text={text.text} fontSize={20} draggable />
                    ))} */}
          {/* {images.map((image, i) => {
                        const [img] = useImage(image.src);
                        return <KonvaImage key={i} x={image.x} y={image.y} image={img} draggable />;
                    })} */}
        </Layer>
      </Stage>
      <button onClick={saveAsPDF}>Save as PDF</button>
    </>
  );
};

export default PDFCanvas;
