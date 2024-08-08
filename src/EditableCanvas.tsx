import { KonvaEventObject } from 'konva/lib/Node';
import React from 'react';
import { Stage, Layer, Rect, Text, Image, Transformer, Line } from 'react-konva';
import useImage from 'use-image';
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

const EditableCanvas = () => {
  const [selectedId, selectShape] = React.useState<string | null>(null);
  const [rectangles, setRectangles] = React.useState<rectType[]>([]);
  const [textObjects, setTextObjects] = React.useState<TextType[]>([]);
  const [images, setImages] = React.useState<ImageType[]>([]);

  const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    // Deselect when clicked on empty area
    if (e.target === e.target.getStage()) {
      selectShape(null);
      return;
    }
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

  const addImage = (imageUrl: string) => {
    const newImage = {
      x: 10,
      y: 10,
      src: imageUrl,
      id: `img${images.length + 1}`,
    };
    setImages([...images, newImage]);
  };

  return (
    <>
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
        onMouseDown={handleMouseDown}
      >
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
          {images.map((img, i) => {
            const image = document.createElement('img');
            image.src = img.src;
            return (
              <Image
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
          {texts.map((text, i) => (
            <Text
              key={i}
              x={text.x}
              y={text.y}
              text={text.text}
              fontSize={20}
              draggable
            />
          ))}
          {images.map((image, i) => {
            const [img] = useImage(image.src);
            return (
              <KonvaImage
                key={i}
                x={image.x}
                y={image.y}
                image={img}
                draggable
              />
            );
          })}
        </Layer>
      </Stage>
    </>
  );
};

export default EditableCanvas;
