console.log('Loading puckFactory.js');


// src/factories/puckFactory.js
import {
  CATEGORY_BALL,
  CATEGORY_PUCK,
  CATEGORY_BEARING,
  CATEGORY_ARENA,
  CATEGORY_SENSOR,
  CATEGORY_WEDGE,
  CATEGORY_REPULSOR
} from '/src/config/collisionCategories.js';

export function createStarPuck(scene, x, y) {
  const MatterRef = Phaser.Physics.Matter.Matter;

  // --- STAR BODY (from SVG) ---
  const svg = scene.cache.xml.get('starPuckRaw');
  const pathEl = svg?.querySelector('path');
  let starBody;

  if (pathEl && MatterRef.Svg?.pathToVertices) {
    const verts = MatterRef.Svg.pathToVertices(pathEl, 10);
    starBody = MatterRef.Bodies.fromVertices(
      x, y, verts,
      { restitution: 0.6, friction: 0.2, frictionAir: 0.01 },
      true
    );
  } else {
    starBody = MatterRef.Bodies.circle(
      x, y, 60,
      { restitution: 0.6, friction: 0.2, frictionAir: 0.01 }
    );
  }

  const star = scene.add.image(x, y, 'starPuck').setOrigin(0.5, 0.5);
  scene.matter.add.gameObject(star, starBody);
  star.body.label = 'puck_star';

  // Collision filtering for puck body
  star.body.collisionFilter.category = CATEGORY_PUCK;
  star.body.collisionFilter.mask =
    CATEGORY_BALL | CATEGORY_ARENA | CATEGORY_SENSOR | CATEGORY_PUCK | CATEGORY_REPULSOR;

  // --- BEARING BODY ---
  const bearingRadius   = 64;
  const bearingDiameter = 128;

  const bearing = scene.matter.add.image(x, y, 'bearing').setOrigin(0.5, 0.5);
  bearing.setCircle(bearingRadius);
  bearing.setDisplaySize(bearingDiameter, bearingDiameter);
  bearing.setBounce(0.2);
  bearing.setFriction(0.01);
  bearing.setFrictionAir(0.02);
  bearing.body.label = 'puck_bearing';

  // Collision filtering for bearing
  bearing.body.collisionFilter.category = CATEGORY_BEARING;
  bearing.body.collisionFilter.mask =
    CATEGORY_BALL | CATEGORY_ARENA | CATEGORY_SENSOR | CATEGORY_WEDGE;

  // --- CONSTRAINT ---
  const constraint = scene.matter.add.constraint(
    star.body,
    bearing.body,
    0,
    1.0
  );

  return { star, bearing, constraint };
}

export function createTrianglePuck(scene, x, y) {
  const MatterRef = Phaser.Physics.Matter.Matter;

  // --- TRIANGLE BODY (from SVG) ---
  const svg = scene.cache.xml.get('TrianglePuck_Raw');
  const pathEl = svg?.querySelector('path');
  let triBody;

  if (pathEl && MatterRef.Svg?.pathToVertices) {
    const verts = MatterRef.Svg.pathToVertices(pathEl, 10);
    triBody = MatterRef.Bodies.fromVertices(
      x, y, verts,
      { restitution: 0.6, friction: 0.2, frictionAir: 0.01 },
      true
    );
  } else {
    triBody = MatterRef.Bodies.circle(
      x, y, 60,
      { restitution: 0.6, friction: 0.2, frictionAir: 0.01 }
    );
  }

  const tri = scene.add.image(x, y, 'TrianglePuck').setOrigin(0.5, 0.5);
  scene.matter.add.gameObject(tri, triBody);
  tri.body.label = 'puck_triangle';

  // Collision filtering for puck body
  tri.body.collisionFilter.category = CATEGORY_PUCK;
  tri.body.collisionFilter.mask =
    CATEGORY_BALL | CATEGORY_ARENA | CATEGORY_SENSOR | CATEGORY_PUCK | CATEGORY_REPULSOR;

  // --- BEARING2 BODY ---
  const bearingRadius   = 64;
  const bearingDiameter = 128;

  const bearing2 = scene.matter.add.image(x, y, 'bearing2').setOrigin(0.5, 0.5);
  bearing2.setCircle(bearingRadius);
  bearing2.setDisplaySize(bearingDiameter, bearingDiameter);
  bearing2.setBounce(0.2);
  bearing2.setFriction(0.01);
  bearing2.setFrictionAir(0.02);
  bearing2.body.label = 'puck_bearing2';

  // Collision filtering for bearing
  bearing2.body.collisionFilter.category = CATEGORY_BEARING;
  bearing2.body.collisionFilter.mask =
    CATEGORY_BALL | CATEGORY_ARENA | CATEGORY_SENSOR | CATEGORY_WEDGE;

  // --- CONSTRAINT ---
  const constraint = scene.matter.add.constraint(
    tri.body,
    bearing2.body,
    0,
    1.0
  );

  return { tri, bearing2, constraint };
}
