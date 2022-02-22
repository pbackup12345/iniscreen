import React, { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";

const OverlayDiv = styled.div`
  position: absolute;
  top: 0px;
  bottom: 0px;
  left: 0px;
  right: 0px;
  overflow: visible;
`;

const Canvas = styled.canvas`
  display: none;
  background-color: transparent;
  overflow: visible;
  position: absolute;
  left: 0px;
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
  border: 1px dashed black;
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

const blobToBase64 = (blob: any) => {
  const reader = new FileReader();
  reader.readAsDataURL(blob);
  return new Promise((resolve) => {
    reader.onloadend = () => {
      resolve(reader.result);
    };
  });
};

const App = () => {
  const selectDivRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLCanvasElement>(null);
  const [mySrc, setMySrc] = useState<any>("");
  const [showButton, setShowButton] = useState(false);
  const [isSelection, setIsSelection] = useState(false);
  const imgDataRef = useRef<any>();

  const moveStatus = useRef({
    status: 0,
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
  });

  useEffect(() => {
    const blurScreen = () => {
      moveStatus.current = {
        status: 0,
        startX: 0,
        startY: 0,
        endX: 0,
        endY: 0,
      };
      positionSelection(false);
      // @ts-ignore
      const context = imgRef.current.getContext("2d");
      if (context !== null && imgRef.current !== null) {
        context.clearRect(0, 0, imgRef.current.width, imgRef.current.height);
      }
      setTimeout(() => {
        //@ts-ignore
        window.myApi.request("now");
      }, 100);
    };

    window.addEventListener("blur", blurScreen);

    return () => window.removeEventListener("blur", blurScreen);
  }, []);

  useEffect(() => {
    //@ts-ignore

    //@ts-ignore

    window.myApi.onResponse((message) => {
      imgDataRef.current = message;

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

  const makeSelection = () => {
    var ctx = imgRef.current?.getContext("2d");

    var img = new Image();

    img.onload = function () {
      if (imgRef.current) {
        imgRef.current.width = Math.abs(
          moveStatus.current.endX - moveStatus.current.startX
        );
        imgRef.current.height = Math.abs(
          moveStatus.current.endY - moveStatus.current.startY
        );
        const factor = 2;
        ctx?.drawImage(
          img,
          Math.min(
            moveStatus.current.startX * factor,
            moveStatus.current.endX * factor
          ),
          Math.min(
            moveStatus.current.startY * factor + 44,
            moveStatus.current.endY * factor + 44
          ),
          Math.abs(
            (moveStatus.current.endX - moveStatus.current.startX) * factor
          ),
          Math.abs(
            (moveStatus.current.endY - moveStatus.current.startY) * factor
          ),
          0,
          0,
          Math.abs(moveStatus.current.endX - moveStatus.current.startX),
          Math.abs(moveStatus.current.endY - moveStatus.current.startY)
        );
      }

      console.log("done");

      //@ts-ignore
      imgRef.current?.toBlob(async (res) => {
        console.log(res);
        const newRes = await blobToBase64(res);

        console.log(newRes);
        //@ts-ignore
        window.myApi.sendPicture(newRes);
      });
    };

    var blob = new Blob([imgDataRef.current.img], { type: "image/jpeg" });

    img.src = URL.createObjectURL(blob);

    // img.onload = function () {

    return;
  };

  const keydown = useCallback(
    (e: any) => {
      if (e.key === "Escape") {
        //@ts-ignore
        window.myApi.request("data");
      }
      //@ts-ignore
      window.myApi.request("data");
    },

    []
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
    console.log(e.target);
    e.persist();
    setTimeout(() => {
      setShowButton(false);
    }, 100);
    setIsSelection(true);

    moveStatus.current = {
      status: 1,
      startX: e.clientX,
      startY: e.clientY,
      endX: e.clientX,
      endY: e.clientY,
    };

    positionSelection(true);

    e.preventDefault();
    e.stopPropagation();
  };

  const mouseMove = (e: React.MouseEvent) => {
    if (moveStatus.current.status === 0) {
      return;
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
    if (
      Math.abs(moveStatus.current.startX - moveStatus.current.endX) < 10 ||
      Math.abs(moveStatus.current.startY - moveStatus.current.endY) < 10
    ) {
      setShowButton(false);
      setIsSelection(false);
    }

    moveStatus.current = { ...moveStatus.current, status: 0 };
    setShowButton(true);
  };

  return (
    <React.Fragment>
      <OverlayDiv
        onMouseDown={mouseDown}
        onMouseMove={mouseMove}
        onMouseUp={mouseUp}
      >
        <MyImg src={mySrc} />
        <Canvas ref={imgRef} />
        {isSelection ? (
          <SelectionDiv ref={selectDivRef}>
            {showButton ? (
              <button
                onMouseDown={(e: any) => {
                  e.stopPropagation();
                }}
                onMouseUp={(e: any) => {
                  e.stopPropagation();
                }}
                onClick={makeSelection}
              >
                Copy
              </button>
            ) : null}
          </SelectionDiv>
        ) : null}
      </OverlayDiv>
    </React.Fragment>
  );
};

export default App;
