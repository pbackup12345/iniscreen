import React, { useCallback, useEffect, useRef, useState } from "react";
import Popup from "reactjs-popup";
import styled from "styled-components";
import { drawPaths } from "./App.paths";
import "reactjs-popup/dist/index.css";
import { TwitterPicker } from "react-color";

import {
  BiCheck,
  BiFontColor,
  BiRectangle,
  BiRightTopArrowCircle,
  BiText,
  BiUndo,
  BiX,
} from "react-icons/bi";
import interact from "interactjs";
//@ts-ignore
// import { Editor } from "react-image-markup";

let myFactor = 0;

const OverlayDiv = styled.div`
  position: absolute;
  top: 0px;
  bottom: 0px;
  left: 0px;
  right: 0px;
  overflow: visible;
  background: rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const TextDiv = styled.div`
  position: absolute;
  min-width: 8px;
  min-height: 20px;
  font-size: 20px;
  font-family: serif;
  line-height: 20px;
  &:focus {
    outline: 1px solid white;
  }
`;

const CoverDiv = styled.div`
  position: fixed;
  top: 0px;
  bottom: 0px;
  left: 0px;
  right: 0px;
  z-index: 501;
`;

const Canvas = styled.canvas`
  background-color: transparent;
  overflow: visible;
  position: absolute;
  left: 0px;
  right: 0px;
`;

const ToolDiv = styled.div`
  position: absolute;
  bottom: -30px;
  right: 0px;
`;

const MyImg = styled.img`
  display: none;
`;

const SelectionDiv = styled.div`
  position: absolute;
  top: 0px;
  left: 0px;
  width: 0px;
  height: 0px;
  box-shadow: 0px 0px 3000px 3000px rgba(0, 0, 0, 0.1);
  outline: 1px dashed lightgrey;
  background: rgba(0, 0, 0, 0);
  &:before {
    padding: 2px;
    font-size: 10px;
    position: absolute;
    top: -18px;
    background-color: rgba(0, 0, 0, 0.6);
    content: attr(data-size);
    color: white;
    border-radius: 3px;
  }
`;

const App = () => {
  const selectDivRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLCanvasElement>(null);
  const picRef = useRef<HTMLImageElement>(null);
  const [mySrc, setMySrc] = useState<any>("");
  const [showButton, setShowButton] = useState(false);
  const [isSelection, setIsSelection] = useState(false);
  const imgDataRef = useRef<any>();
  const paths = useRef<any>([]);
  const [texts, setTexts] = useState<any>([]);
  const active = useRef<any>(0);
  const popupRef = useRef<any>();
  const [popupOpen, setPopupOpen] = useState(false);
  const [fontColor, setFontColor] = useState("#ff3333");
  const [tool, setTool] = useState("arrow");

  const moveStatus = useRef({
    status: 0,
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
  });

  const toolStatus = useRef({
    status: 0,
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
  });

  useEffect(() => {
    interact("#selectwionx").resizable({
      // resize from all edges and corners
      edges: { left: true, right: true, bottom: true, top: true },

      listeners: {
        move(event) {
          var target = event.target;
          var x = parseFloat(target.getAttribute("data-x")) || 0;
          var y = parseFloat(target.getAttribute("data-y")) || 0;

          // update the element's style
          target.style.width = event.rect.width + "px";
          target.style.height = event.rect.height + "px";

          // translate when resizing from top or left edges
          x += event.deltaRect.left;
          y += event.deltaRect.top;

          target.style.transform = "translate(" + x + "px," + y + "px)";

          moveStatus.current.startX = x;
          moveStatus.current.startY = y;
          moveStatus.current.endX = x + event.rect.width;
          moveStatus.current.endY = y + event.rect.height;

          target.setAttribute("data-x", x);
          target.setAttribute("data-y", y);
          target.textContent =
            Math.round(event.rect.width) +
            "\u00D7" +
            Math.round(event.rect.height);
        },
      },
      modifiers: [
        // keep the edges inside the parent
        interact.modifiers.restrictEdges({
          outer: "parent",
        }),

        // minimum size
        interact.modifiers.restrictSize({
          min: { width: 25, height: 25 },
        }),
      ],

      inertia: false,
    });
  }, []);

  const blurScreen = useCallback(() => {
    moveStatus.current = {
      status: 0,
      startX: 0,
      startY: 0,
      endX: 0,
      endY: 0,
    };
    positionSelection(false);
    setTexts([]);

    paths.current = [];

    // @ts-ignore
    const context = imgRef.current.getContext("2d");
    if (context !== null && imgRef.current !== null) {
      context.clearRect(0, 0, imgRef.current.width, imgRef.current.height);
    }
    setTimeout(() => {
      //@ts-ignore
      window.myApi.request("now");
    }, 100);
  }, []);

  useEffect(() => {
    window.addEventListener("blur", blurScreen);

    return () => window.removeEventListener("blur", blurScreen);
  }, [blurScreen]);

  useEffect(() => {
    //@ts-ignore

    //@ts-ignore

    window.myApi.onResponse((message) => {
      imgDataRef.current = message;
      var blob = new Blob([imgDataRef.current.img], { type: "image/jpeg" });
      const url = URL.createObjectURL(blob);
      setMySrc(url);
      if (picRef.current) {
        picRef.current.style.width = imgDataRef.current.width + "px";
        picRef.current.style.marginTop =
          -(navigator.platform === "MacIntel" ? 25 : 0) + "px";
      }

      if (picRef.current) {
        picRef.current.onload = function () {
          const factor =
            (picRef.current?.naturalWidth as number) / imgDataRef.current.width;

          myFactor = factor;

          if (imgRef.current) {
            imgRef.current.width =
              (picRef.current?.naturalWidth as number) / factor;
            imgRef.current.height =
              (picRef.current?.naturalHeight as number) / factor;
            imgRef.current.style.marginTop =
              -(navigator.platform === "MacIntel" ? 25 : 0) + "px";

            imgRef.current.style.backgroundImage = "url('" + url + "')";
            imgRef.current.style.backgroundSize = "cover";
          }

          //@ts-ignore
          window.myApi.setOpacity();

          // ctx?.drawImage(
          //   picRef.current as HTMLImageElement,
          //   0,
          //   0,
          //   picRef.current?.naturalWidth as number,
          //   picRef.current?.naturalHeight as number,
          //   0,
          //   0,
          //   imgDataRef.current.width,
          //   imgDataRef.current.height
          // );
        };
      }

      // img.onload = function () {
      //   ctx?.drawImage(img, 0, 0, message.width, message.height);
      // };

      // setMySrc(img.src);
    });
    //@ts-ignore
    // return () =>
    //   //@ts-ignore
    //   window.myApi.ipcRenderer //@ts-ignore
    //     .removeAllListeners("shot") as unknown as void;
  }, []);

  // const setOriginalSize = () => {
  //   const allScreens = remote.screen.getAllDisplays();

  //   const [x, y] = win.getPosition();
  //   const [width, height] = win.getSize();

  //   let fullWidth = 0;
  //   let fullHeight = 0;
  //   let left = 0;
  //   let top = 0;

  //   console.log(allScreens);

  //   allScreens.forEach((screen: any) => {
  //     left = Math.min(left, screen.bounds.x * screen.scaleFactor);
  //     top = Math.min(top, screen.bounds.y * screen.scaleFactor);
  //     fullHeight = fullHeight + screen.size.height * screen.scaleFactor;
  //     fullWidth = fullWidth + screen.size.width * screen.scaleFactor;
  //   });

  //   if (
  //     x !== left ||
  //     y !== top ||
  //     fullHeight !== height ||
  //     fullWidth !== width
  //   ) {
  //     win.setSize(Math.floor(fullWidth), Math.floor(fullHeight));

  //     win.setPosition(Math.floor(left), Math.floor(top));
  //     // @ts-ignore
  //     imgRef.current.width = Math.floor(fullWidth);

  //     // @ts-ignore
  //     imgRef.current.height = Math.floor(fullHeight);
  //   }
  // };

  // const createDecoy = () => {
  //   const { BrowserWindow } = window.require("electron").remote;

  //   let win = new BrowserWindow({
  //     x: -30000,
  //     y: -30000,
  //     width: 10,
  //     height: 10,
  //     frame: false,
  //     webPreferences: {
  //       nodeIntegration: true,
  //     },
  //     show: false,
  //     transparent: true,
  //   });

  //   decoy.current = win;

  //   win.on("closed", () => (decoy.current = null));
  // };

  const makeSelection = (e: any) => {
    e.stopPropagation();

    var newCanvas = document.createElement("canvas");

    newCanvas.width = Math.abs(
      moveStatus.current.endX - moveStatus.current.startX
    );
    newCanvas.height = Math.abs(
      moveStatus.current.endY - moveStatus.current.startY
    );

    var newCtx = newCanvas.getContext("2d");

    let factor =
      (picRef.current?.naturalWidth as number) / imgDataRef.current.width;

    newCtx?.drawImage(
      picRef.current as any,
      Math.min(
        moveStatus.current.startX * factor,
        moveStatus.current.endX * factor
      ),
      Math.min(
        moveStatus.current.startY * factor +
          (navigator.platform === "MacIntel" ? 25 * factor : 0),
        moveStatus.current.endY * factor +
          (navigator.platform === "MacIntel" ? 25 * factor : 0)
      ),
      Math.abs((moveStatus.current.endX - moveStatus.current.startX) * factor),
      Math.abs((moveStatus.current.endY - moveStatus.current.startY) * factor),
      0,
      0,
      newCanvas.width,
      newCanvas.height
    );

    factor = 1;

    newCtx?.drawImage(
      imgRef.current as any,
      Math.min(
        moveStatus.current.startX * factor,
        moveStatus.current.endX * factor
      ),
      Math.min(
        moveStatus.current.startY * factor +
          (navigator.platform === "MacIntel" ? 25 * factor : 0),
        moveStatus.current.endY * factor +
          (navigator.platform === "MacIntel" ? 25 * factor : 0)
      ),
      Math.abs((moveStatus.current.endX - moveStatus.current.startX) * factor),
      Math.abs((moveStatus.current.endY - moveStatus.current.startY) * factor),
      0,
      0,
      newCanvas.width,
      newCanvas.height
    );

    console.log(newCanvas);

    var data_url = newCanvas.toDataURL("image/png");

    console.log(data_url);

    //@ts-ignore

    //@ts-ignore
    window.myApi.sendPicture(data_url);
    moveStatus.current = {
      status: 0,
      startX: 0,
      startY: 0,
      endX: 0,
      endY: 0,
    };
    positionSelection(false);

    return;
  };

  const keydown = useCallback(
    (e: any) => {
      if (e.target.id) {
        return;
      }
      if (e.key === "Escape") {
        blurScreen();
        //@ts-ignore
        window.myApi.request("data");
      }
      //@ts-ignore
      //window.myApi.request("data");
    },

    [blurScreen]
  );

  useEffect(() => {
    // window.addEventListener("blur", blurScreen, true);
    //setOriginalSize();
    window.addEventListener("keydown", keydown, true);

    return () => {
      // window.removeEventListener("blur", blurScreen, true);
      window.removeEventListener("keydown", keydown, true);
    };
  }, [keydown]);

  const positionSelection = (show: boolean) => {
    const minX = Math.min(moveStatus.current.startX, moveStatus.current.endX);
    const minY = Math.min(moveStatus.current.startY, moveStatus.current.endY);
    const maxX = Math.max(moveStatus.current.startX, moveStatus.current.endX);
    const maxY = Math.max(moveStatus.current.startY, moveStatus.current.endY);

    if (selectDivRef.current) {
      if (show) {
        selectDivRef.current.style.display = "block";
        console.log("block");
      } else {
        selectDivRef.current.style.display = "none";
        console.log("none");
      }

      selectDivRef.current.style.top = minY + "px";
      selectDivRef.current.style.left = minX + "px";
      selectDivRef.current.style.width = maxX - minX + "px";
      selectDivRef.current.style.height = maxY - minY + "px";

      let dataSize = "";

      if (maxX - minX > 0 || maxY - minY > 0) {
        dataSize = maxX - minX + "x" + (maxY - minY);
      }

      selectDivRef.current.setAttribute("data-size", dataSize);
    }
  };

  const mouseDown = (e: React.MouseEvent) => {
    e.persist();

    setShowButton(false);

    setIsSelection(true);
    setTexts([]);
    paths.current = [];

    moveStatus.current = {
      status: 1,
      startX: e.clientX,
      startY: e.clientY,
      endX: e.clientX,
      endY: e.clientY,
    };

    const target = document.getElementById("selectionx");
    if (target) {
      target.style.transform = "none";
    }
    positionSelection(true);

    e.preventDefault();
    e.stopPropagation();
  };

  const mouseDownInside = (e: React.MouseEvent) => {
    console.log("mousedown");
    e.persist();

    const id = Date.now();

    active.current = id;

    if (tool === "text") {
      e.stopPropagation();

      return;
    }

    if (moveStatus.current.status === 2) {
      moveStatus.current.status = 0;
      return;
    }

    toolStatus.current.startX = e.clientX;
    toolStatus.current.startY =
      e.clientY + (navigator.platform === "MacIntel" ? 25 : 0);

    moveStatus.current.status = 2;

    e.preventDefault();
    e.stopPropagation();
  };

  const setTextLine = (e: any) => {
    e.persist();

    e.stopPropagation();

    const id = Date.now();

    if (texts.find((item: any) => item.active)) {
      return;
    }

    active.current = id;

    if (tool === "text") {
      setTexts([
        {
          id: id,
          type: "text",
          text: "",
          x: e.clientX,
          y: e.clientY,
          active: true,
          fontColor: fontColor,
        },
      ]);

      setTimeout(() => {
        document.getElementById(id + "")?.focus();
      }, 0);

      return;
    }
  };

  const textKeyDown = (e: any) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      e.target.blur();
    }
  };

  const mouseMove = (e: React.MouseEvent) => {
    console.log(moveStatus.current.status);
    if (moveStatus.current.status === 0) {
      return;
    }

    if (moveStatus.current.status === 2) {
      let xSmall = Math.min(moveStatus.current.startX, moveStatus.current.endX);
      let ySmall = Math.min(moveStatus.current.startY, moveStatus.current.endY);
      let xBig = Math.max(moveStatus.current.startX, moveStatus.current.endX);
      let yBig = Math.max(moveStatus.current.startY, moveStatus.current.endY);

      if (e.clientX < xSmall) {
        toolStatus.current.endX = xSmall;
      } else if (e.clientX > xBig) {
        toolStatus.current.endX = xBig;
      } else {
        toolStatus.current.endX = e.clientX;
      }

      if (e.clientY < ySmall) {
        toolStatus.current.endY =
          ySmall + (navigator.platform === "MacIntel" ? 25 : 0);
      } else if (e.clientY > yBig) {
        toolStatus.current.endY =
          yBig + (navigator.platform === "MacIntel" ? 25 : 0);
      } else {
        toolStatus.current.endY =
          e.clientY + (navigator.platform === "MacIntel" ? 25 : 0);
      }

      const last = paths.current.slice(-1)[0];

      if (last?.type !== "text" && active.current === last?.id) {
        paths.current.pop();
      }

      if (tool === "arrow") {
        const ctx = imgRef.current?.getContext("2d") as any;

        ctx.clearRect(0, 0, imgRef.current?.width, imgRef.current?.height);

        paths.current.push({
          type: "arrow",
          id: active.current,
          params: {
            fromx: toolStatus.current.startX,
            fromy: toolStatus.current.startY,
            tox: toolStatus.current.endX,
            toy: toolStatus.current.endY,
            fontColor: fontColor,
          },
        });

        drawPaths(ctx, paths.current);

        return;
      }

      if (tool === "rect") {
        const ctx = imgRef.current?.getContext("2d") as any;

        ctx.clearRect(0, 0, imgRef.current?.width, imgRef.current?.height);

        paths.current.push({
          type: "rect",
          id: active.current,
          params: {
            fromx: toolStatus.current.startX,
            fromy: toolStatus.current.startY,
            tox: toolStatus.current.endX,
            toy: toolStatus.current.endY,
            fontColor: fontColor,
          },
        });
        ctx.beginPath();
        drawPaths(ctx, paths.current);
        ctx.stroke();

        return;
      }
    }

    moveStatus.current = {
      ...moveStatus.current,
      endX: e.clientX,
      endY: e.clientY,
    };

    positionSelection(true);
    e.preventDefault();
    e.stopPropagation();
  };

  const mouseUp = (e: React.MouseEvent) => {
    if (moveStatus.current.status === 2) {
      // if (toolRef.current === "arrow" || toolRef.current === "rect") {
      //   paths.current.push(paths.current.slice(-1)[0]);
      // }

      moveStatus.current.status = 0;
      return;
    }

    if (
      Math.abs(moveStatus.current.startX - moveStatus.current.endX) < 10 ||
      Math.abs(moveStatus.current.startY - moveStatus.current.endY) < 10
    ) {
      setShowButton(false);
      setIsSelection(false);
    }

    console.log("up");
    moveStatus.current = { ...moveStatus.current, status: 0 };
    setShowButton(true);
  };

  const blurMe = (e: any) => {
    console.log(e.relatedTarget);
    const newItem = texts[0];
    paths.current.push({
      ...newItem,
      active: false,
      type: "text",
      params: {
        text: e.target.innerText,
        x: newItem.x,
        y: newItem.y + (navigator.platform === "MacIntel" ? 20 * myFactor : 0),
        fontColor: newItem.fontColor,
      },
    });
    setTexts([]);
    const ctx = imgRef.current?.getContext("2d") as any;
    drawPaths(ctx, paths.current);
  };

  const chooseTool = (e: any, inTool: string) => {
    setTool(inTool);
    e.stopPropagation();
  };

  const clickPopup = (e: any) => {
    e.stopPropagation();
    setPopupOpen(false);
    popupRef.current.close();
  };

  const changeFontColor = (color: any) => {
    setFontColor(color.hex);
    popupRef.current.close();
    setPopupOpen(false);
  };

  const undoLast = (e: any) => {
    e.stopPropagation();
    const ctx = imgRef.current?.getContext("2d") as any;
    ctx.clearRect(0, 0, imgRef.current?.width, imgRef.current?.height);
    paths.current.pop();
    drawPaths(ctx, paths.current);
  };

  return (
    <React.Fragment>
      <OverlayDiv
        onMouseDown={mouseDown}
        onMouseMove={mouseMove}
        onMouseUp={mouseUp}
      >
        {popupOpen ? <CoverDiv onMouseDownCapture={clickPopup} /> : null}

        {texts.map((item: any) => (
          <TextDiv
            key={item.id}
            id={item.id}
            style={{
              top: item.y,
              left: item.x,
              zIndex: 5000,
              color: item.fontColor,
            }}
            contentEditable={item.active}
            onBlur={blurMe}
            onKeyDown={textKeyDown}
          >
            {item.text}
          </TextDiv>
        ))}
        <MyImg src={mySrc} ref={picRef} />
        <Canvas ref={imgRef} />

        <SelectionDiv
          id="selectionx"
          ref={selectDivRef}
          onMouseUp={mouseUp}
          onMouseDown={mouseDownInside}
          onMouseMove={mouseMove}
          onClick={setTextLine}
          style={{ display: isSelection ? "block" : "none" }}
        >
          {/* {showButton ? (
              <Editor height={height} width={width} ref={editorRef} />
            ) : null} */}

          <React.Fragment>
            <ToolDiv style={{ opacity: showButton ? 1 : 0 }}>
              <button
                style={{ color: "red" }}
                onMouseDown={(e: any) => {
                  e.stopPropagation();
                }}
                onMouseUp={(e: any) => {
                  if (showButton) {
                    e.stopPropagation();
                  }
                }}
                onClick={blurScreen}
              >
                <BiX size={18} />
              </button>
              <button
                onMouseDown={(e: any) => {
                  e.stopPropagation();
                }}
                onMouseUp={(e: any) => {
                  if (showButton) {
                    e.stopPropagation();
                  }
                }}
                onClick={undoLast}
              >
                <BiUndo size={18} />
              </button>
              <button
                style={tool === "arrow" ? { background: "lightgrey" } : {}}
                onMouseDown={(e: any) => {
                  e.stopPropagation();
                }}
                onMouseUp={(e: any) => {
                  if (showButton) {
                    e.stopPropagation();
                  }
                }}
                onClick={(e) => chooseTool(e, "arrow")}
              >
                <BiRightTopArrowCircle size={18} />
              </button>
              <button
                style={tool === "text" ? { background: "lightgrey" } : {}}
                onMouseDown={(e: any) => {
                  e.stopPropagation();
                }}
                onMouseUp={(e: any) => {
                  if (showButton) {
                    e.stopPropagation();
                  }
                }}
                onClick={(e) => chooseTool(e, "text")}
              >
                <BiText size={18} />
              </button>
              <button
                style={tool === "rect" ? { background: "lightgrey" } : {}}
                onMouseDown={(e: any) => {
                  e.stopPropagation();
                }}
                onMouseUp={(e: any) => {
                  if (showButton) {
                    e.stopPropagation();
                  }
                }}
                onClick={(e) => chooseTool(e, "rect")}
              >
                <BiRectangle size={18} />
              </button>

              <Popup
                contentStyle={{ width: "auto" }}
                ref={popupRef}
                onOpen={() => setPopupOpen(true)}
                trigger={
                  <button
                    style={{ color: fontColor }}
                    onMouseDown={(e: any) => {
                      e.stopPropagation();
                    }}
                    onMouseUp={(e: any) => {
                      if (showButton) {
                        e.stopPropagation();
                      }
                    }}
                  >
                    <BiFontColor size={18} />
                  </button>
                }
                position="top center"
              >
                <TwitterPicker
                  triangle="hide"
                  onChangeComplete={changeFontColor}
                />
              </Popup>
              <button
                style={{ background: "lightgreen" }}
                onMouseDown={(e: any) => {
                  e.stopPropagation();
                }}
                onMouseUp={(e: any) => {
                  if (showButton) {
                    e.stopPropagation();
                  }
                }}
                onClick={makeSelection}
              >
                <BiCheck size={18} />
              </button>
            </ToolDiv>
          </React.Fragment>
        </SelectionDiv>
      </OverlayDiv>
    </React.Fragment>
  );
};

export default App;
