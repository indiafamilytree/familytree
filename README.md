# Family Tree App

A dynamic web application for visualizing and managing family trees. Built using Vue 3, Vite, and Tailwind CSS on the frontend with AWS Amplify powering authentication and data services, and Cytoscape.js handling interactive graph visualization.

---

## Overview

The Family Tree App lets you create, edit, import, and export family trees interactively. Users can add persons and family relationships, visualize the relationships as a graph, and adjust the layout with multiple visualization options. Authentication is handled through AWS Amplify using Google sign-in, and the app supports exporting the tree as an SVG or JSON file.

---

## Features

- **Interactive Graph Visualization:** Visualize your family tree using Cytoscape.js with support for multiple layouts (Compound, Dagre, Klay, Cose Bilkent).
- **Dynamic Family Management:** Add or edit individual persons and family nodes using intuitive forms.
- **Authentication:** Secure login via AWS Amplify and Google OAuth.
- **Data Import/Export:** Download your family tree as JSON or export the graph as an SVG image.
- **State Management:** Uses Pinia for managing the application state, keeping track of persons, families, nodes, and edges.
- **Tailwind CSS:** Rapid UI development with Tailwind’s utility-first approach.

---

## Tech Stack

- **Frontend:** Vue 3 with `<script setup>`, Vite, and Tailwind CSS
- **State Management:** Pinia
- **Graph Visualization:** Cytoscape.js with plugins (dagre, klay, cose-bilkent, panzoom, and svg export)
- **Backend & Authentication:** AWS Amplify (using Cognito for auth and AppSync for data operations)
- **Build Tools:** Vite, PostCSS, and Tailwind CSS

---

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v14+ recommended)
- npm (comes with Node.js)

### Clone the Repository

```bash
git clone https://github.com/yourusername/family-tree-app.git
cd family-tree-app
