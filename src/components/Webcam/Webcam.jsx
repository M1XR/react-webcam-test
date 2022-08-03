import React, { useEffect, useState } from "react";
import Webcam from "react-webcam";
import { Slider } from "@mui/material";
import "./Webcam.css";
import Tesseract from "tesseract.js";

const VIDEO_HEIGHT = 60;
const VIDEO_WIDTH = 220;

const MAX_SCALE = 5;
const MIN_SCALE = 1;

const videoConstraints = {
  width: VIDEO_WIDTH,
  height: VIDEO_HEIGHT,
  facingMode: "environment",
};

const ZOOM_INCREMENT = 0.5;

export const WebcamCapture = () => {
  const [image, setImage] = useState("");
  const [scale, setScale] = useState(1);
  const [text, setText] = useState("");
  const [processing, setProcessing] = useState(true);
  const [cleanText, setCleanText] = useState("");

  useEffect(() => {
    const initialScale = getComputedStyle(
      document.documentElement
    ).getPropertyValue("--camera-scale");

    setScale(initialScale);
  }, []);

  useEffect(() => {
    if (!image) return;

    setProcessing(true);

    Tesseract.recognize(image, "eng", {
      logger: (m) => console.log(m),
    }).then(({ data: { text } }) => {
      console.log(text);
      setProcessing(false);
      setText(text);
    });
  }, [image]);

  useEffect(() => {
    if (!text) return;
    console.log(text);

    const t = text;
    const f5Number =
      /F5[0-9A-Z]{15}/.exec(t)?.[0] || /FS[0-9A-Z]{15}/.exec(t)?.[0];
    if (!f5Number) return;

    const result = f5Number
      .replace(/[UO]/g, 0)
      .replace(/S/g, 5)
      .replace(/I/g, 1)
      .replace(/G/g, 8);

    let cleaned = [];

    for (let index = 0; index < result.length; index++) {
      if (result[index] === f5Number[index]) {
        cleaned.push({ text: result[index], color: "green" });
      } else {
        cleaned.push({ text: result[index], color: "red" });
      }
    }

    console.log(cleaned);
    setCleanText(cleaned);
  }, [text]);

  const webcamRef = React.useRef(null);

  const handleCapture = (img) => {
    if (img) {
      setImage(img);
    }
  };

  const zoomIn = () => {
    let newScale = parseFloat(scale) + ZOOM_INCREMENT;
    if (newScale > MAX_SCALE) return;
    setScale(newScale);
    document.documentElement.style.setProperty("--camera-scale", newScale);
  };

  const zoomOut = () => {
    let newScale = parseFloat(scale) - ZOOM_INCREMENT;
    if (newScale < MIN_SCALE) return;
    setScale(newScale);
    document.documentElement.style.setProperty("--camera-scale", newScale);
  };

  const zoomChange = (e, newValue) => {
    let newScale =
      (newValue + 100 / (MAX_SCALE - MIN_SCALE)) /
      (100 / (MAX_SCALE - MIN_SCALE));

    console.log(newValue);
    console.log(newScale);

    setScale(newScale);
    document.documentElement.style.setProperty("--camera-scale", newScale);
  };

  const onCapture = () => {
    var image = new Image();
    image.onload = function () {
      const canvas = document.createElement("canvas");
      const canvas2dContext = canvas.getContext("2d");

      // width/height of the image after processing
      let dx = image.width / scale;
      let dy = image.height / scale;

      // starting co-ordinates
      let x1 = (image.width - dx) / 2;
      let y1 = (image.height - dy) / 2;

      canvas.width = VIDEO_WIDTH;
      canvas.height = VIDEO_HEIGHT;

      console.log(image.height);
      console.log(image.width);

      canvas2dContext.drawImage(
        image,
        x1,
        y1,
        dx,
        dy,
        0,
        0,
        canvas.width,
        canvas.height
      );

      let img = canvas.toDataURL("image/png");
      handleCapture(img);
    };
    image.src = webcamRef.current.getScreenshot();
  };

  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <div>
        <div style={{ width: "250px", height: "150px" }}>
          <div className="webcam-container">
            <div
              className="webcam-img"
              style={{ width: VIDEO_WIDTH, height: VIDEO_HEIGHT }}
            >
              {image === "" ? (
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={videoConstraints}
                />
              ) : (
                <img src={image} alt={"unit_image"} />
              )}
            </div>
            <div style={{ marginTop: "50px" }}>
              {image !== "" ? (
                <>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setImage("");
                      setCleanText("");
                    }}
                    className="webcam-btn"
                  >
                    Retake Image
                  </button>
                  <p>Extracted Text: {processing && "Processing..."}</p>
                  <div style={{ backgroundColor: "#F6D55C", padding: "5px" }}>
                    {!processing &&
                      cleanText &&
                      cleanText.map((item, index) => (
                        <span className={item.color} key={index}>
                          {item.text}
                        </span>
                      ))}
                  </div>
                </>
              ) : (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div>
                    <Slider
                      aria-label="Zoom"
                      value={
                        scale * (100 / (MAX_SCALE - MIN_SCALE)) -
                        100 / (MAX_SCALE - MIN_SCALE)
                      }
                      onChange={zoomChange}
                      sx={{ width: "50%" }}
                    />
                  </div>
                  <div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        onCapture();
                      }}
                      className="webcam-btn"
                    >
                      Capture
                    </button>
                    <button onClick={zoomOut}>Zoom Out -</button>
                    <button onClick={zoomIn}>Zoom In +</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
