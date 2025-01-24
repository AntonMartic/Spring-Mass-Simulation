# Spring-Mass-Damper Simulation

This repository contains a visual and interactive simulation of a spring-mass-damper system, implemented using **D3.js**. The project was developed as part of the TNM093 Visual Applications Lab course to demonstrate the behavior of interconnected masses and springs, influenced by forces like restoring force and damping.

## Features

- Interactive grid-based simulation of masses and springs.
- Drag and move nodes to see the system's response to external displacement.
- Configurable parameters such as:
  - Number of rows and columns (grid size)
  - Structural stiffness
  - Shear stiffness
  - Mass of nodes
  - Damping force
  - Restore force
- Supports two numerical integration methods:
  - Euler Method
  - Verlet Method
- Visual representation of structural and shear springs.
- Easy-to-use slider-based UI for live parameter adjustments.

## Technologies Used

- **D3.js**: For rendering SVG elements and interactivity.
- **HTML5**: Markup structure for the simulation.
- **CSS3**: Basic styling (optional).
- **JavaScript**: Logic for the simulation.
