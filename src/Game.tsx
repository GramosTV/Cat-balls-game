import { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons';
const width = window.innerWidth;
const height = window.innerHeight;
const multiplier = 1.3;
export const Game = () => {
  const sceneRef = useRef<any>(null);
  const dropXRef = useRef<any>(null);
  const [engine] = useState(Matter.Engine.create());
  const [points, setPoints] = useState(0);
  const [nextBall, setNextBall] = useState(1);
  const createParticles = (x: number, y: number, count: number, color: string = 'yellow') => {
    for (let i = 0; i < count; i++) {
      // Create a small particle (circle)
      const particle = Matter.Bodies.circle(x, y, mobile ? 2 : 4, {
        restitution: 0.5, // Make it slightly bouncy
        label: 'particle',
        render: {
          fillStyle: color, // Use the provided color for the particles
        },
      });

      // Give the particle an upward velocity to simulate flying up
      const randomVelocity = {
        x: (Math.random() - 0.5) * 5, // Random x velocity between -2.5 and 2.5
        y: -(Math.random() * 10 + 5), // Random upward y velocity between -5 and -15 (negative to go up)
      };

      Matter.Body.setVelocity(particle, randomVelocity);

      // Add the particle to the world
      Matter.World.add(engine.world, [particle]);

      // Schedule particle removal after a delay (fade out effect)
      setTimeout(() => {
        Matter.World.remove(engine.world, [particle]);
      }, 1000 + Math.random() * 500); // Remove after 1 to 1.5 seconds
    }
  };
  const mobile = window.innerWidth < 700;
  const [ballCount, setBallCount] = useState(0);
  const ballRadius = mobile ? 11 : 20;
  const [dropX, setDropX] = useState(width * 0.28 + ballRadius); // Initial drop position in the middle

  // Define the radius for the small ball
  // Starting radius for all balls

  useEffect(() => {
    // Update the dropX ref whenever dropX changes
    dropXRef.current = dropX;
  }, [dropX]);

  useEffect(() => {
    // Set gravity
    engine.gravity.y = 0.5;

    // Create the renderer

    const render = Matter.Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width, // Increased width for the bigger box
        height, // Increased height for the bigger box
        wireframes: false, // Set to true to see wireframes for debugging
      },
    });
    const context = render.canvas.getContext('2d', { antialias: true });

    if (context instanceof CanvasRenderingContext2D) {
      // Assign the context only if it's a valid 2D context
      render.context = context;
    } else {
      console.error('Failed to retrieve a 2D context');
    }
    // Create static bodies for the ground and walls

    let ground = Matter.Bodies.rectangle(width * 0.5, height * 0.74, width * 0.63, height * 0.08, {
      isStatic: true,
      render: {
        sprite: {
          texture: './img/cardboard.png',
          xScale: (width * 0.63) / 612,
          yScale: (height * 0.08) / 404,
        },
      },
    });

    let leftWall = Matter.Bodies.rectangle(width * 0.2, height * 0.45, width * 0.03, height * 0.5, {
      isStatic: true,
      render: {
        sprite: {
          texture: './img/cardboard.png',
          xScale: (width * 0.03) / 612,
          yScale: (height * 0.5) / 404,
        },
      },
    });

    let rightWall = Matter.Bodies.rectangle(width * 0.8, height * 0.45, width * 0.03, height * 0.5, {
      isStatic: true,
      render: {
        sprite: {
          texture: './img/cardboard.png',
          xScale: (width * 0.03) / 612,
          yScale: (height * 0.5) / 404,
        },
      },
    });
    if (mobile) {
      ground = Matter.Bodies.rectangle(width * 0.5, height * 0.705, width * 0.8, height * 0.05, {
        isStatic: true,
        render: {
          sprite: {
            texture: './img/cardboard.png',
            xScale: (width * 0.8) / 612,
            yScale: (height * 0.05) / 404,
          },
        },
      });
      leftWall = Matter.Bodies.rectangle(width * 0.115, height * 0.43, width * 0.03, height * 0.5, {
        isStatic: true,
        render: {
          sprite: {
            texture: './img/cardboard.png',
            xScale: (width * 0.03) / 612,
            yScale: (height * 0.5) / 404,
          },
        },
      });
      rightWall = Matter.Bodies.rectangle(width * 0.885, height * 0.43, width * 0.03, height * 0.5, {
        isStatic: true,
        render: {
          sprite: {
            texture: './img/cardboard.png',
            xScale: (width * 0.03) / 612,
            yScale: (height * 0.5) / 404,
          },
        },
      });
    }
    // Add ground and walls to the world
    Matter.World.add(engine.world, [ground, leftWall, rightWall]);

    // Create spikes below the box
    const spikeWidth = 20;
    const spikeHeight = 50;
    const spikeCount = Math.floor(width / spikeWidth); // Number of spikes that can fit

    const spikes = [];
    for (let i = 0; i < spikeCount; i++) {
      const spike = Matter.Bodies.polygon(0 + i * spikeWidth * 2, height, 3, spikeHeight, {
        isStatic: true,
        label: 'spike',
        angle: Math.PI / 2,
        render: {
          fillStyle: 'red',
        },
      });
      spikes.push(spike);
    }
    Matter.World.add(engine.world, spikes);

    // Function to continuously update the physics engine
    const update = () => {
      Matter.Engine.update(engine, 1000 / 60); // Update the engine at 60 fps

      // Check if any ball is out of bounds (beyond the walls or below the ground)

      requestAnimationFrame(update); // Call update again on the next frame
    };

    // Start the rendering and physics update loop
    Matter.Render.run(render);
    update(); // Start the manual update loop

    // Setup collision detection
    Matter.Events.on(engine, 'collisionStart', (event) => {
      const pairs = event.pairs;

      pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;

        // Check if a ball hits a spike
        if (
          (bodyA.label === 'ball' && bodyB.label === 'spike') ||
          (bodyB.label === 'ball' && bodyA.label === 'spike')
        ) {
          const ball: any = bodyA.label === 'ball' ? bodyA : bodyB;
          const spike = bodyA.label === 'spike' ? bodyA : bodyB;

          // Remove the ball from the world
          Matter.World.remove(engine.world, ball);

          // Create red particles at the ball's position
          createParticles(ball.position.x, ball.position.y, ball.mergeStep || 1, 'red');
          setPoints((prev) => prev - (ball.mergeStep || 1));
        }

        // Check if two balls collide to merge them
        if (bodyA.label === 'ball' && bodyB.label === 'ball') {
          mergeBalls(bodyA, bodyB);
        }
      });
    });

    // Cleanup when the component unmounts
  }, []);

  // Function to drop a new ball
  const dropBall = () => {
    let radius = nextBall === 1 ? ballRadius : ballRadius * multiplier ** (nextBall - 1);
    console.log(radius);
    const newBall: any = Matter.Bodies.circle(dropXRef.current, 50 / (mobile ? 2 : 1), radius, {
      restitution: 0.8, // Make it bouncy
      label: 'ball', // Label to identify the ball
      render: {
        sprite: {
          texture: `./img/${nextBall}.png`, // Replace with the actual path to your image
          xScale: (2 * radius) / 600,
          yScale: (2 * radius) / 600,
        },
      },
    });
    newBall.mergeStep = nextBall;
    Matter.World.add(engine.world, [newBall]);
    setNextBall(Math.floor(Math.random() * 3) + 1);
    setBallCount(ballCount + 1);
  };

  // Function to merge two balls
  const mergeBalls = (bodyA: any, bodyB: any) => {
    // Calculate the position and radius of the new merged ball
    if (bodyA.mergeStep === bodyB.mergeStep) {
      let particles = (bodyA.mergeStep || 1) + 1;
      const newX = (bodyA.position.x + bodyB.position.x) / 2;
      let newY = (bodyA.position.y + bodyB.position.y) / 2;

      const mergeStep = (bodyA.mergeStep || 1) + 1;
      let img = './img/1.png';
      for (let i = 2; i <= 20; i++) {
        // particles += Math.round(i / 3);
        if (mergeStep === i) {
          img = `./img/${i}.png`; // Dynamically assign image for merge steps from 2 to 20
          break;
        }
      }

      let newRadius = multiplier * bodyA.circleRadius;
      // if (newY + newRadius > height * 0.74) {
      //   newY = height * 0.74 - newRadius;
      // }
      // Create a new merged ball with updated merge step
      const mergedBall: any = Matter.Bodies.circle(newX, newY, newRadius, {
        restitution: 0.8, // Make it bouncy
        label: 'ball', // Label to identify the ball
        render: {
          sprite: {
            texture: img, // Replace with the dynamically assigned image
            xScale: (2 * newRadius) / 600,
            yScale: (2 * newRadius) / 600,
          },
        },
      });

      // Add mergeStep to the new ball
      mergedBall.mergeStep = mergeStep;

      // Remove the old balls from the world
      Matter.World.remove(engine.world, [bodyA, bodyB]);

      // Add the new merged ball to the world
      Matter.World.add(engine.world, [mergedBall]);
      setPoints((prev) => (prev += particles));
      createParticles(newX, newY, particles);
      const popSound = new Audio('pop.ogg');
      popSound.play();
    }
  };

  // Handle key presses for moving the drop point
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        setDropX((prevX) => Math.max(prevX - width * (mobile ? 0.03 : 0.05), width * 0.22 + ballRadius)); // Move left, ensure it's not off the left edge
      } else if (event.key === 'ArrowRight') {
        setDropX((prevX) => Math.min(prevX + width * (mobile ? 0.03 : 0.05), width * 0.77 - ballRadius)); // Move right, ensure it's not off the right edge
      } else if (event.key === ' ') {
        // Spacebar
        // dropBall(); // Use the ref to get the current dropX
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Cleanup event listener on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []); // Empty dependency array since we're using refs

  return (
    <div>
      <div ref={sceneRef} style={{ position: 'relative', width, height }}>
        {/* Visual indication of drop-off point */}
        <div
          style={{
            position: 'absolute',
            top: 120 / (mobile ? 1.7 : 1),
            left: dropX - 50 / (mobile ? 1.7 : 1), // Center the marker
            width: 100 / (mobile ? 1.7 : 1),
            height: 120 / (mobile ? 1.7 : 1),
            // opacity: 0.2,
            // backgroundColor: 'red',
            backgroundImage: 'url(./img/pipe.png)', // Use the url() function
            backgroundSize: 'cover',
            transform: 'translateY(-100%)', // Move it above the drop position
          }}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: height * 0.08,
          width,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* <button
          style={{
            fontSize: 32,
            backgroundColor: 'transparent',
            color: '#444447',
            border: '2px #444447 solid',
            padding: 20,
            paddingTop: 10,
            paddingBottom: 10,
            borderRadius: 12,
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          Play
        </button> */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {/* <span style={{ color: '#444447', fontSize: 24, marginBottom: 10 }}>Press space to play</span> */}
          {/* <span style={{ color: '#444447', fontSize: 24, marginBottom: 10 }}>Arrow left/right to move pipe</span> */}

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              // marginLeft: 15,
              marginRight: 25,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 0,
              }}
            >
              <span style={{ color: '#444447', fontSize: mobile ? 22 : 24, marginBottom: 4 }}>Points: </span>
              <span style={{ color: '#444447', fontSize: mobile ? 20 : 24 }} id="points">
                {points}
              </span>
            </div>
            <span style={{ color: '#444447', fontSize: mobile ? 22 : 24, marginBottom: 4 }}>Next ball:</span>
            <div
              style={{
                height: ballRadius * multiplier ** (3 - 1) * 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={`./img/${nextBall}.png`}
                width={(nextBall === 1 ? ballRadius : ballRadius * multiplier ** (nextBall - 1)) * 2}
                height={(nextBall === 1 ? ballRadius : ballRadius * multiplier ** (nextBall - 1)) * 2}
                alt=""
              />
            </div>
          </div>
          <div>
            <div
              onClick={dropBall}
              style={{
                width: mobile ? 160 + 8 : 320 + 8,
                padding: mobile ? 12 : 15,
                border: mobile ? '2px solid #444447' : '3px solid #444447',
                borderRadius: 8,
                color: '#444447',
                fontSize: mobile ? 22 : 24,
                textAlign: 'center',
                cursor: 'pointer',
                marginBottom: 8,
                backgroundImage: 'url(./img/bg.png)',
                userSelect: 'none',
              }}
            >
              Drop Ball
            </div>
            <div>
              <button
                style={{
                  width: mobile ? 80 : 160,
                  padding: mobile ? 10 : 12,
                  border: mobile ? '2px solid #444447' : '3px solid #444447',
                  borderRadius: 8,
                  cursor: 'pointer',
                  backgroundColor: 'transparent',
                  marginRight: 8,
                  backgroundImage: 'url(./img/bg.png)',
                  backgroundPosition: 'left',
                }}
                onClick={() =>
                  setDropX((prevX) => Math.max(prevX - (mobile ? 30 : 50), width * (mobile ? 0.15 : 0.22) + ballRadius))
                }
              >
                <FontAwesomeIcon icon={faArrowLeft} style={{ fontSize: 26 }} color="#444447" />
              </button>
              <button
                style={{
                  width: mobile ? 80 : 160,
                  padding: mobile ? 10 : 12,
                  border: mobile ? '2px solid #444447' : '3px solid #444447',
                  borderRadius: 8,
                  cursor: 'pointer',
                  backgroundColor: 'transparent',
                  backgroundImage: 'url(./img/bg.png)',
                  backgroundPosition: 'right',
                }}
                onClick={() =>
                  setDropX((prevX) => Math.min(prevX + (mobile ? 30 : 50), width * (mobile ? 0.85 : 0.77) - ballRadius))
                }
              >
                <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: 26 }} color="#444447" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
