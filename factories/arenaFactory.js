console.log('Loading arenaFactory.js');


// src/factories/arenaFactory.js
import {
  CATEGORY_BALL,
  CATEGORY_PUCK,
  CATEGORY_BEARING,
  CATEGORY_ARENA,
  CATEGORY_SENSOR,
  CATEGORY_WEDGE
} from '/src/config/collisionCategories.js';

export function createArena(scene, originX, originY, puckComposite) {
  const puckSpanPx = puckComposite.star.displayWidth;

  const arenaWidth  = puckSpanPx * 12.2;
  const arenaHeight = puckSpanPx * 7.6;

  const wallT       = puckSpanPx * 0.40;
  const goalDepth   = puckSpanPx * 1.00;
  const sensorW     = Math.max(6, puckSpanPx * 0.15);
  const throatInset = arenaHeight * 0.20;
  const cx = originX;
 

  // --- Wedge parameters ---
  // Long side (horizontal leg) defined as a ratio of arena width for easy future tuning
  const wedgeLongSide = arenaWidth * 0.15;   // tweak this ratio later
  // Vertical leg height computed to bridge from inner wall face to throat band
  const wedgeHRequired = Math.max(2, throatInset - wallT / 2);

  const xLeft  = originX - arenaWidth / 2;
  const xRight = originX + arenaWidth / 2;
  const yTop   = originY - arenaHeight / 2;
  const yBot   = originY + arenaHeight / 2;
  const cy     = (yTop + yBot) / 2;

  // True inner faces (± wallT/2 from wall centers)
  const xLeftInner  = xLeft + wallT / 2;
  const xRightInner = xRight - wallT / 2;
  const yTopInner   = yTop + wallT / 2;
  const yBotInner   = yBot - wallT / 2;

  // --- Top/bottom walls ---
  const segments = 3;
  const segW = (xRight - xLeft) / segments;
  for (let i = 0; i < segments; i++) {
    const cxSeg = xLeft + segW * (i + 0.5);
    scene.matter.add.rectangle(cxSeg, yTop, segW, wallT, {
      isStatic: true,
      label: 'arena_wall_top',
      collisionFilter: {
        category: CATEGORY_ARENA,
        mask: CATEGORY_BALL | CATEGORY_PUCK | CATEGORY_BEARING
      }
    });
    scene.matter.add.rectangle(cxSeg, yBot, segW, wallT, {
      isStatic: true,
      label: 'arena_wall_bot',
      collisionFilter: {
        category: CATEGORY_ARENA,
        mask: CATEGORY_BALL | CATEGORY_PUCK | CATEGORY_BEARING
      }
    });
  }

  // ---- Wedge builder: world verts on interior faces, centroid placement ----
  function makeInteriorWedge(corner) {
    let A, B, C;

    switch (corner) {
      case 'bottom-left': {
        const yLong = yBotInner, xVert = xLeftInner;
        const yThroatBottom = yBot - throatInset;
        const H = yLong - yThroatBottom;
        const hClamped = Math.max(2, H);

        A = { x: xVert,                 y: yLong };
        B = { x: xVert + wedgeLongSide, y: yLong };
        C = { x: xVert,                 y: yLong - hClamped };
        break;
      }
      case 'bottom-right': {
        const yLong = yBotInner, xVert = xRightInner;
        const yThroatBottom = yBot - throatInset;
        const H = yLong - yThroatBottom;
        const hClamped = Math.max(2, H);

        A = { x: xVert,                 y: yLong };
        B = { x: xVert - wedgeLongSide, y: yLong };
        C = { x: xVert,                 y: yLong - hClamped };
        break;
      }
      case 'top-left': {
        const yLong = yTopInner, xVert = xLeftInner;
        const yThroatTop = yTop + throatInset;
        const H = yThroatTop - yLong;
        const hClamped = Math.max(2, H);

        A = { x: xVert,                 y: yLong };
        B = { x: xVert + wedgeLongSide, y: yLong };
        C = { x: xVert,                 y: yLong + hClamped };
        break;
      }
      case 'top-right': {
        const yLong = yTopInner, xVert = xRightInner;
        const yThroatTop = yTop + throatInset;
        const H = yThroatTop - yLong;
        const hClamped = Math.max(2, H);

        A = { x: xVert,                 y: yLong };
        B = { x: xVert - wedgeLongSide, y: yLong };
        C = { x: xVert,                 y: yLong + hClamped };
        break;
      }
    }

    const cxTri = (A.x + B.x + C.x) / 3;
    const cyTri = (A.y + B.y + C.y) / 3;

    const localVerts = [
      { x: A.x - cxTri, y: A.y - cyTri },
      { x: B.x - cxTri, y: B.y - cyTri },
      { x: C.x - cxTri, y: C.y - cyTri }
    ];

    console.log(`Wedge ${corner}`, { worldVerts: { A, B, C }, centroid: { x: cxTri, y: cyTri } });

    return { pos: { x: cxTri, y: cyTri }, verts: localVerts };
  }

  // --- Build one goal assembly ---
  function buildGoal(side) {
    const isLeft = side === 'left';
    const xEdge  = isLeft ? xLeft : xRight;
    const xSign  = isLeft ? -1 : 1;
    const label  = isLeft ? 'goal_left' : 'goal_right';

    // Throat diagonals
    {
      const x1 = xEdge, y1 = yTop;
      const x2 = xEdge + xSign * goalDepth, y2 = yTop + throatInset;
      const cx2 = (x1 + x2) / 2, cy2 = (y1 + y2) / 2;
      const len = Math.hypot(x2 - x1, y2 - y1);
      const ang = Math.atan2(y2 - y1, x2 - x1);
      scene.matter.add.rectangle(cx2, cy2, len, wallT, {
        isStatic: true,
        angle: ang,
        label: `${label}_throat_top`,
        collisionFilter: {
          category: CATEGORY_ARENA,
          mask: CATEGORY_BALL | CATEGORY_PUCK | CATEGORY_BEARING
        }
      });
    }
    {
      const x1 = xEdge, y1 = yBot;
      const x2 = xEdge + xSign * goalDepth, y2 = yBot - throatInset;
      const cx2 = (x1 + x2) / 2, cy2 = (y1 + y2) / 2;
      const len = Math.hypot(x2 - x1, y2 - y1);
      const ang = Math.atan2(y2 - y1, x2 - x1);
      scene.matter.add.rectangle(cx2, cy2, len, wallT, {
        isStatic: true,
        angle: ang,
        label: `${label}_throat_bot`,
        collisionFilter: {
          category: CATEGORY_ARENA,
          mask: CATEGORY_BALL | CATEGORY_PUCK | CATEGORY_BEARING
        }
      });
    }

    // Wedges (set collisionFilter at creation time)
    const topCorner = isLeft ? 'top-left' : 'top-right';
    const botCorner = isLeft ? 'bottom-left' : 'bottom-right';

    const top = makeInteriorWedge(topCorner);
    scene.matter.add.fromVertices(top.pos.x, top.pos.y, top.verts, {
      isStatic: true,
      label: `${label}_wedge_top`,
      collisionFilter: {
        category: CATEGORY_WEDGE,
        mask: CATEGORY_BALL | CATEGORY_BEARING | CATEGORY_SENSOR
      }
    });

    const bot = makeInteriorWedge(botCorner);
    scene.matter.add.fromVertices(bot.pos.x, bot.pos.y, bot.verts, {
      isStatic: true,
      label: `${label}_wedge_bot`,
      collisionFilter: {
        category: CATEGORY_WEDGE,
        mask: CATEGORY_BALL | CATEGORY_BEARING | CATEGORY_SENSOR
      }
    });

    // Back wall
    scene.matter.add.rectangle(
      xEdge + xSign * goalDepth,
      cy,
      wallT,
      (yBot - yTop) - 2 * throatInset,
      {
        isStatic: true,
        label: `${label}_back`,
        collisionFilter: {
          category: CATEGORY_ARENA,
          mask: CATEGORY_BALL | CATEGORY_PUCK | CATEGORY_BEARING
        }
      }
    );

    // Sensor
    scene.matter.add.rectangle(
      xEdge,
      cy,
      sensorW,
      (yBot - yTop) - 2 * throatInset,
      {
        isStatic: true,
        isSensor: true,
        label,
        collisionFilter: {
          category: CATEGORY_SENSOR,
          mask: CATEGORY_BALL | CATEGORY_PUCK | CATEGORY_BEARING | CATEGORY_WEDGE
        }
      }
    );
  }

  buildGoal('left');
  buildGoal('right');

  return {
  arenaWidth,
  arenaHeight,
  throatInset,
  goalDepth,
  bounds: {
    xLeft,
    xRight,
    yTop,
    yBot,
    wallT,
    xOuterLeft: xLeft - wallT,
    xOuterRight: xRight + wallT,
    yOuterTop: yTop - wallT,
    yOuterBot: yBot + wallT
  },
  center: { cx, cy } 
  };
}
