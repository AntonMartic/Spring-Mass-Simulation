
// Main simulation logic

// Select the SVG container
const svg = d3.select("#simulation-area");
const width = svg.attr("width");
const height = svg.attr("height");

// examples of default settings that can be changed later
let rows = parseInt(document.getElementById("rows").value, 10);
let cols = parseInt(document.getElementById("cols").value, 10);
let restoreForce = parseFloat(document.getElementById("restore-force").value);
let damping = parseFloat(document.getElementById("damping").value);
const nodeRadius = 5;
const timeStep = 0.01;
const padding = 100;

// stiffness
let struc_stiff = parseFloat(document.getElementById("struc_stiff").value);
let shear_stiff = parseFloat(document.getElementById("shear_stiff").value);

// node mass
let mass = parseFloat(document.getElementById("mass").value);
//const mass = 0.2;

// Approximation method
let selectedMethod = document.getElementById("method-select").value;

console.log("method:",selectedMethod);

let initialPositions = []; // To store previous positions for Verlet

// Arrays to hold positions, velocities, and forces
let positions = [];
let velocities = [];
let forces = [];
let isRunning = false;

/**
* Initialize the grid with nodes and reset their positions, velocities, and forces.
*/
function initializeGrid() {
   positions = [];
   velocities = [];
   forces = [];
   initialPositions = []; // Store initial positions for restoring force

   const xStep = (width - 2 * padding) / (cols - 1); // kommer inte fungera då griden är 1x1
   const yStep = (height - 2 * padding) / (rows - 1);  

   for (let i = 0; i < rows; i++) {
       const positionRow = [];
       const velocityRow = [];
       const forceRow = [];
       const initialRow = []; // for restoring force
       for (let j = 0; j < cols; j++) {
           const x = padding + j * xStep;
           const y = padding + i * yStep;
           positionRow.push([x, y]); // ! TODO: think about how to calculate initial positions for the nodes
           velocityRow.push([0, 0]); // Initial velocity
           forceRow.push([0, 0]); // Initial force
           initialRow.push([x, y]); // Rest positions
       }
       positions.push(positionRow);
       velocities.push(velocityRow);
       forces.push(forceRow);
       initialPositions.push(initialRow); // Store rest positions
   }
   drawNodes();
   drawEdges();
}

/**
* Draw the nodes (circles) on the SVG.
*/
function drawNodes() {
   // example of how to draw nodes on the svg
   const nodes = svg.selectAll("circle").data(positions.flat());
   nodes
       .enter()
       .append("circle")
       .attr("r", nodeRadius)
       .merge(nodes)
       .attr("cx", (d) => d[0])
       .attr("cy", (d) => d[1])
       .attr("fill", "blue")
       .attr("stroke", "white")
       .attr("stroke-width", 2)
       .call(d3.drag().on("drag", dragged));

   nodes.exit().remove();
}

function dragged(event, d) {
    // Find the node in the positions array
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            // Match the node's original position
            if (positions[i][j][0] === d[0] && positions[i][j][1] === d[1]) {
                // Update the position in the array
                positions[i][j][0] = event.x;
                positions[i][j][1] = event.y;

                // Redraw edges to reflect the updated position
                drawEdges();

                // Update the SVG circle position
                d3.select(this)
                    .attr("cx", event.x)
                    .attr("cy", event.y);

                return; // Exit once the correct node is updated
            }
        }
    }
}

/**
* Draw the edges (lines) connecting the nodes.
*/
function drawEdges() {
   // TODO: add your implementation here to connect the nodes with lines.

   const edges = [];
   for(let i = 0; i < rows; i++){
       for(let j = 0; j < cols; j++){
           // Strucutral horizontal springs
           if(j < cols - 1){
               edges.push({
                   x1: positions[i][j][0],
                   y1: positions[i][j][1],
                   x2: positions[i][j+1][0],
                   y2: positions[i][j+1][1],
                   type: "structural"
               });
           }
           // Strucutral vertical springs
           if(i < rows - 1){
               edges.push({
                   x1: positions[i][j][0],
                   y1: positions[i][j][1],
                   x2: positions[i+1][j][0],
                   y2: positions[i+1][j][1],
                   type: "structural"
               });
           }
           // Shear diagonal springs ,top left to bottom right (next column)
           if(i < rows - 1 && j < cols - 1){
               edges.push({
                   x1: positions[i][j][0],
                   y1: positions[i][j][1],
                   x2: positions[i+1][j+1][0],
                   y2: positions[i+1][j+1][1],
                   type: "shear"
               });
           }
           // Shear diagonal springs ,top right to bottom left (previous column)
           if(i < rows - 1 && j > 0){
               edges.push({
                   x1: positions[i][j][0],
                   y1: positions[i][j][1],
                   x2: positions[i+1][j-1][0],
                   y2: positions[i+1][j-1][1],
                   type: "shear"
               });
           }
       }
   }
   // Bind data to lines and draw them
   const lines = svg.selectAll("line").data(edges);

   lines
       .enter()
       .append("line")
       .merge(lines)
       .attr("x1", d => d.x1)
       .attr("y1", d => d.y1)
       .attr("x2", d => d.x2)
       .attr("y2", d => d.y2)
       .attr("stroke", d => (d.type === "shear" ? "blue" : "black")) // Blue for shear springs
       .attr("stroke-width", 2);

   lines.exit().remove();
}

/**
* Calculate forces acting on each node.
* This function is a placeholder for students to implement force calculations.
*/
function calculateForces() {
   // Reset forces
   for (let i = 0; i < rows; i++) {
       for (let j = 0; j < cols; j++) {
           forces[i][j][0] = 0;
           forces[i][j][1] = 0;
       }
   }

   // - Calculate spring forces (horizontal, vertical, diagonal/sheer).
   // - Add damping forces.
   // const struc_stiff = 20;  // Structural stiffness
   const l0StructHorizontal = (width - 2 * padding) / (cols - 1); // Rest length for structural springs, horizontal
   const l0StructVertical = (height - 2 * padding) / (rows - 1); // Rest length for structural springs, vertical 

   // Shear spring constants
   // const shear_stiff = 7;  // Shear stiffness
   const l0Shear = Math.sqrt(Math.pow(l0StructHorizontal, 2) + Math.pow(l0StructVertical, 2)); // Rest length for diagonal springs (normalized)

   // Structural damping constants
   const struc_damp = 0.1 * damping;
    // Shear damping constants
   const shear_damp = 0.05 * damping;

   // Calculate spring and damping forces
   for (let i = 0; i < rows; i++) {
       for (let j = 0; j < cols; j++) {
           // Horizontal structural spring
           if (j < cols - 1) applySpringForce(i, j, i, j + 1, struc_stiff, struc_damp, l0StructHorizontal);

           // Vertical structural spring
           if (i < rows - 1) applySpringForce(i, j, i + 1, j, struc_stiff, struc_damp, l0StructVertical);

           // Diagonal/shear springs
           if (i < rows - 1 && j < cols - 1) applySpringForce(i, j, i + 1, j + 1, shear_stiff, shear_damp, l0Shear);
           if (i < rows - 1 && j > 0) applySpringForce(i, j, i + 1, j - 1, shear_stiff, shear_damp, l0Shear);
       }
   }

   // - Add restoring forces.
   for (let i = 0; i < rows; i++) {
       for (let j = 0; j < cols; j++) {
           const currentX = positions[i][j][0];
           const currentY = positions[i][j][1];
           const restX = initialPositions[i][j][0]; // Rest position X
           const restY = initialPositions[i][j][1]; // Rest position Y

           console.log("restoringforce:", restoreForce);

           const restoringForceX = -restoreForce * (currentX - restX);
           const restoringForceY = -restoreForce * (currentY - restY);

           forces[i][j][0] += restoringForceX;
           forces[i][j][1] += restoringForceY;
       }
   }

   
}

function applySpringForce(i1, j1, i2, j2, k, b, l0) {
   // Calculate the displacement vector
   const dx = positions[i2][j2][0] - positions[i1][j1][0]; // rp - rq (x)
   const dy = positions[i2][j2][1] - positions[i1][j1][1]; // rp - rq (y)
   const distance = Math.sqrt(dx * dx + dy * dy); // |rp - rq|
   const displacement = distance - l0; // |rp - rq| - l0  (Stretch/compression from rest length)
   console.log("l0",l0);

   // Normalize the displacement vector
   const nx = dx / distance; // rp - rq / |rp - rq| (x)
   const ny = dy / distance; // rp - rq / |rp - rq| (y)

   // Calculate the spring force
   const fx = k * displacement * nx; 
   const fy = k * displacement * ny;

   // Relative velocity
   const relVelX = velocities[i2][j2][0] - velocities[i1][j1][0]; // vp - vq (x)
   const relVelY = velocities[i2][j2][1] - velocities[i1][j1][1]; // vp - vq (y)

   // Project relative velocity onto the spring direction
   const relVelDotUnit = relVelX * nx + relVelY * ny; // Scalar projection
   const dampingForceX = b * relVelDotUnit * nx; 
   const dampingForceY = b * relVelDotUnit * ny;

   // Total force (spring + damping)
   const totalForceX = fx + dampingForceX;
   const totalForceY = fy + dampingForceY;

   // Apply equal and opposite forces to the connected nodes
   forces[i1][j1][0] += totalForceX / mass;
   forces[i1][j1][1] += totalForceY / mass;
   forces[i2][j2][0] -= totalForceX / mass;
   forces[i2][j2][1] -= totalForceY / mass;

}

function updatePositions() {
   
   calculateForces();

   // Euler method
   if(selectedMethod === "euler"){
       for (let i = 0; i < rows; i++) {
           for (let j = 0; j < cols; j++) {
               // TODO: potentially implement position and velocity updates here.
               // Example:
               // velocities[i][j][0] += some calculation
               // velocities[i][j][1] += some calculation
               // positions[i][j][0] += some calculation;
               // positions[i][j][1] += some calculation;

               // Extract net force on the current node
               const fx = forces[i][j][0];
               const fy = forces[i][j][1];

               // Update velocity (Euler method)
               velocities[i][j][0] += (fx / mass) * timeStep; // vx = vx + (Fx/m) * dt
               velocities[i][j][1] += (fy / mass) * timeStep; // vy = vy + (Fy/m) * dt

               // Update position (Euler method)
               positions[i][j][0] += velocities[i][j][0] * timeStep; // x = x + vx * dt
               positions[i][j][1] += velocities[i][j][1] * timeStep; // y = y + vy * dt

           }
       }  
   } else if (selectedMethod === "verlet"){ // Verlet method
       for (let i = 0; i < rows; i++) {
           for (let j = 0; j < cols; j++) {
               // Current and previous positions
               const [x, y] = positions[i][j]; // v[x,y]
               const [prevX, prevY] = initialPositions[i][j]; // v[x-1,y-1]

               // Current acceleration
               const ax = forces[i][j][0] / mass; // (Fx/m)
               const ay = forces[i][j][1] / mass; // (Fy/m)

               // Verlet position update
               const nextX = 2 * x - prevX + timeStep * timeStep * ax; // vx+1 = 2vx - vx-1 + (Fx/m) * dt^2
               const nextY = 2 * y - prevY + timeStep * timeStep * ay; // vy+1 = 2vy - vy-1 + (Fy/m) * dt^2

               // Update previous positions
               initialPositions[i][j][0] += x; // vx
               initialPositions[i][j][1] += y; // vy

               // Update velocity (optional for visualization purposes)
               velocities[i][j][0] = (nextX - prevX) / (2 * timeStep); // vx+1 = 1/2dt(vx - vx-1)
               velocities[i][j][1] = (nextY - prevY) / (2 * timeStep); // vy+1 = 1/2dt(vy - vy-1)

               // Enforce boundary conditions
               positions[i][j][0] = Math.max(padding, Math.min(width - padding, positions[i][j][0]));
               positions[i][j][1] = Math.max(padding, Math.min(height - padding, positions[i][j][1]));

               
           }
       }
   }
   
   //   drawNodes();
   //   drawEdges();

   drawNodes();
   drawEdges();
}

/**
* Main simulation loop.
* Continuously updates the simulation as long as `isRunning` is true.
*/
function simulationLoop() {
   if (!isRunning) return;

   updatePositions();
   requestAnimationFrame(simulationLoop);
}


// ********** Event listeners examples for controls **********

// Start/Stop simulation
document.getElementById("toggle-simulation").addEventListener("click", () => {
   isRunning = !isRunning;
   document.getElementById("toggle-simulation").innerText = isRunning ? "Stop Simulation" : "Start Simulation";
   if (isRunning) simulationLoop();
});

// Update grid rows
document.getElementById("rows").addEventListener("input", (e) => {
   rows = parseInt(e.target.value, 10);
   initializeGrid();
});

// Update grid columns
document.getElementById("cols").addEventListener("input", (e) => {
   cols = parseInt(e.target.value, 10);
   initializeGrid();
});

// Update restore force
document.getElementById("restore-force").addEventListener("input", (e) => {
   restoreForce = parseFloat(e.target.value);
   document.getElementById("restore-force-value").textContent = restoreForce.toFixed(2);
});

// Update damping
document.getElementById("damping").addEventListener("input", (e) => {
   damping = parseFloat(e.target.value);
   document.getElementById("damping-value").textContent = damping.toFixed(2);
});

// Initialize the simulation
initializeGrid();
// additional functions 

document.addEventListener("DOMContentLoaded", () => {
   // Set initial value for the selected method
   let selectedMethod = document.getElementById("method-select").value;
   console.log("Initial method:", selectedMethod);

   // Event listener for dropdown changes
   document.getElementById("method-select").addEventListener("change", (e) => {
       selectedMethod = e.target.value; // Update the selected method
       console.log("Selected method:", selectedMethod);
   });
});

// Update structural stiffness
document.getElementById("struc_stiff").addEventListener("input", (e) => {
    struc_stiff = parseFloat(e.target.value);
    document.getElementById("struc_stiff").textContent = struc_stiff.toFixed(2);
 });

// Update shear stiffness
document.getElementById("shear_stiff").addEventListener("input", (e) => {
    shear_stiff = parseFloat(e.target.value);
    dociment.getElementById("shear_stiff").textContent = shear_stiff.toFixed(2);
 });

// Update mass
document.getElementById("mass").addEventListener("input", (e) => {
    mass = parseFloat(e.target.value);
    document.getElementById("mass").textContent = mass.toFixed(2);
 });

