# Interval Tree Visualizer

An interactive, industry-ready web application for visualizing interval tree data structures with insert, delete, and search operations.

## Features

🌳 **Interactive Visualization**: Beautiful, responsive tree visualization with zoom and pan support
- Zoom in/out using Ctrl + Scroll or zoom buttons
- Drag to pan around the tree
- Reset view button to return to default position

➕ **Tree Operations**:
- Insert intervals dynamically
- Delete intervals from the tree
- Search for overlapping intervals

🎨 **Beautiful UI**: Modern, eye-pleasing interface with:
- Gradient backgrounds
- Smooth animations and transitions
- Responsive design for all screen sizes
- Real-time visual feedback

⚡ **Performance**: Optimized implementation with:
- AVL tree balancing for efficient operations
- O(log n) search, insert, and delete operations
- Efficient tree layout algorithm

## Technologies Used

- **React 19**: Latest React with hooks
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **SVG**: Scalable vector graphics for tree rendering

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Interval-Tree-Visualizer
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Usage

### Insert Intervals
1. Enter the start and end values of the interval in the "Insert/Delete" panel
2. Click "Insert" to add the interval to the tree
3. The tree will automatically rebalance using AVL rotations

### Delete Intervals
1. Enter the interval you want to delete
2. Click "Delete" to remove it from the tree
3. The tree will automatically rebalance

### Search for Overlapping Intervals
1. Enter the search interval in the "Search" panel
2. Click "Search"
3. If an overlapping interval is found, it will be highlighted in green

### Navigate the Tree
- **Zoom**: Hold Ctrl (or Cmd on Mac) and scroll, or use the +/- buttons
- **Pan**: Click and drag to move around the tree
- **Reset**: Click "Reset View" to return to the default position

## Project Structure

```
src/
├── components/
│   └── IntervalTreeVisualizer.jsx  # Main visualization component
├── App.jsx                          # Root component
├── App.css                          # Styles
└── main.jsx                         # Entry point
```

## Algorithm Details

### Interval Tree
An interval tree is a data structure used to efficiently find intervals that overlap with a given query interval. Each node stores:
- `interval`: The [start, end] interval
- `max`: Maximum endpoint in the subtree rooted at this node
- `left`, `right`: Child nodes
- `height`: For AVL balancing

### Operations
- **Insert**: O(log n) - Uses AVL tree insertion with rotations
- **Delete**: O(log n) - Uses AVL tree deletion with rotations  
- **Search**: O(log n) - Finds any overlapping interval efficiently

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Interval Tree data structure based on CLRS algorithm
- AVL tree balancing for optimal performance
- SVG rendering for crisp, scalable tree visualization
