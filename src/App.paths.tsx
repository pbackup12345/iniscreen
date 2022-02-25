function canvas_arrow(context: any, params: any) {
  const { fromx, fromy, tox, toy } = params;
  var headlen = 10; // length of head in pixels
  var dx = tox - fromx;
  var dy = toy - fromy;
  var angle = Math.atan2(dy, dx);
  context.strokeStyle = params.fontColor;
  context.beginPath();
  context.moveTo(fromx, fromy);
  context.lineTo(tox, toy);
  context.lineWidth = 2;
  context.lineTo(
    tox - headlen * Math.cos(angle - Math.PI / 6),
    toy - headlen * Math.sin(angle - Math.PI / 6)
  );
  context.moveTo(tox, toy);
  context.lineTo(
    tox - headlen * Math.cos(angle + Math.PI / 6),
    toy - headlen * Math.sin(angle + Math.PI / 6)
  );
  context.stroke();
}

function canvas_rect(context: any, params: any) {
  context.strokeStyle = params.fontColor;
  context.beginPath();
  context.rect(
    Math.min(params.fromx, params.tox),
    Math.min(params.fromy, params.toy),
    Math.abs(params.fromx - params.tox),
    Math.abs(params.fromy - params.toy)
  );
  context.stroke();
}

function canvas_text(context: any, params: any) {
  context.font = "20px serif";
  context.fillStyle = params.fontColor;
  context.strokeStyle = params.fontColor;
  console.log(params);
  context.beginPath();
  context.fillText(params.text, params.x, params.y);
  context.fill();
  context.stroke();
}

const actions: any = {
  arrow: canvas_arrow,
  rect: canvas_rect,
  text: canvas_text,
};

export const drawPaths = (context: any, paths: any) => {
  for (let g = 0; g < paths.length; g++) {
    const path = paths[g];
    if (actions[path.type]) {
      actions[path.type](context, path.params);
    }
  }
};
