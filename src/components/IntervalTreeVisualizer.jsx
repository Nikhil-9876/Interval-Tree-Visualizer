import { useState, useRef, useEffect } from 'react'

// Interval Tree Node class
class ITreeNode {
  constructor(interval) {
    this.interval = interval
    this.max = interval[1]
    this.left = null
    this.right = null
    this.height = 1
  }
}

// Interval Tree class
class IntervalTree {
  constructor() {
    this.root = null
  }

  getHeight(node) {
    return node ? node.height : 0
  }

  updateHeight(node) {
    if (node) {
      node.height = Math.max(this.getHeight(node.left), this.getHeight(node.right)) + 1
      this.updateMax(node)
    }
  }

  updateMax(node) {
    if (node) {
      node.max = node.interval[1]
      if (node.left) node.max = Math.max(node.max, node.left.max)
      if (node.right) node.max = Math.max(node.max, node.right.max)
    }
  }

  rotateRight(y) {
    const x = y.left
    const T2 = x.right
    x.right = y
    y.left = T2
    this.updateHeight(y)
    this.updateHeight(x)
    return x
  }

  rotateLeft(x) {
    const y = x.right
    const T2 = y.left
    y.left = x
    x.right = T2
    this.updateHeight(x)
    this.updateHeight(y)
    return y
  }

  getBalance(node) {
    return node ? this.getHeight(node.left) - this.getHeight(node.right) : 0
  }

  doOverlap(interval1, interval2) {
    return interval1[0] <= interval2[1] && interval2[0] <= interval1[1]
  }

  insert(root, interval) {
    if (!root) return new ITreeNode(interval)

    if (interval[0] < root.interval[0] || 
        (interval[0] === root.interval[0] && interval[1] < root.interval[1])) {
      root.left = this.insert(root.left, interval)
    } else {
      root.right = this.insert(root.right, interval)
    }

    this.updateHeight(root)
    const balance = this.getBalance(root)

    if (balance > 1 && interval[0] < root.left.interval[0])
      return this.rotateRight(root)

    if (balance < -1 && interval[0] > root.right.interval[0])
      return this.rotateLeft(root)

    if (balance > 1 && interval[0] > root.left.interval[0]) {
      root.left = this.rotateLeft(root.left)
      return this.rotateRight(root)
    }

    if (balance < -1 && interval[0] < root.right.interval[0]) {
      root.right = this.rotateRight(root.right)
      return this.rotateLeft(root)
    }

    return root
  }

  insertInterval(interval) {
    this.root = this.insert(this.root, interval)
  }

  minValueNode(node) {
    while (node.left) node = node.left
    return node
  }

  deleteNode(root, interval) {
    if (!root) return root

    const cmpStart = interval[0] - root.interval[0]
    const cmpEnd = interval[1] - root.interval[1]

    if (cmpStart < 0 || (cmpStart === 0 && cmpEnd < 0)) {
      root.left = this.deleteNode(root.left, interval)
    } else if (cmpStart > 0 || (cmpStart === 0 && cmpEnd > 0)) {
      root.right = this.deleteNode(root.right, interval)
    } else {
      if (!root.left || !root.right) {
        const temp = root.left || root.right
        root = temp || null
      } else {
        const temp = this.minValueNode(root.right)
        root.interval = temp.interval
        root.right = this.deleteNode(root.right, temp.interval)
      }
    }

    if (!root) return root

    this.updateHeight(root)
    const balance = this.getBalance(root)

    if (balance > 1 && this.getBalance(root.left) >= 0)
      return this.rotateRight(root)

    if (balance > 1 && this.getBalance(root.left) < 0) {
      root.left = this.rotateLeft(root.left)
      return this.rotateRight(root)
    }

    if (balance < -1 && this.getBalance(root.right) <= 0)
      return this.rotateLeft(root)

    if (balance < -1 && this.getBalance(root.right) > 0) {
      root.right = this.rotateRight(root.right)
      return this.rotateLeft(root)
    }

    return root
  }

  deleteInterval(interval) {
    this.root = this.deleteNode(this.root, interval)
  }

  search(root, interval) {
    if (!root) return null
    if (this.doOverlap(root.interval, interval)) return root
    if (root.left && root.left.max >= interval[0])
      return this.search(root.left, interval)
    return this.search(root.right, interval)
  }

  searchInterval(interval) {
    return this.search(this.root, interval)
  }

  // Calculate tree layout with proper spacing
  getTreeLayout(node = this.root, viewportWidth = 800) {
    if (!node) return { nodes: [], edges: [] }
    
    const nodes = []
    const edges = []
    const verticalSpacing = 100
    const minHorizontalSpacing = 150

    const assignPositions = (n, x, y, level, offset, width) => {
      if (!n) return { width: 0, nodeX: x }

      const leftWidth = n.left ? this.getSubtreeWidth(n.left, level + 1) : 0
      const rightWidth = n.right ? this.getSubtreeWidth(n.right, level + 1) : 0
      
      const totalWidth = leftWidth + rightWidth || minHorizontalSpacing
      const leftRatio = leftWidth / totalWidth
      const rightRatio = rightWidth / totalWidth

      const nodeX = x + offset

      nodes.push({
        id: `${n.interval[0]}-${n.interval[1]}-${level}`,
        interval: n.interval,
        max: n.max,
        x: nodeX,
        y: y,
        level
      })

      if (n.left) {
        const leftChildInfo = assignPositions(n.left, x, y + verticalSpacing, level + 1, offset - rightRatio * totalWidth / 2, leftWidth)
        const leftNodeX = leftChildInfo.nodeX
        edges.push({
          from: { x: nodeX, y: y + 40 },
          to: { x: leftNodeX, y: y + verticalSpacing - 40 }
        })
      }

      if (n.right) {
        const rightChildInfo = assignPositions(n.right, x, y + verticalSpacing, level + 1, offset + leftRatio * totalWidth / 2, rightWidth)
        const rightNodeX = rightChildInfo.nodeX
        edges.push({
          from: { x: nodeX, y: y + 40 },
          to: { x: rightNodeX, y: y + verticalSpacing - 40 }
        })
      }

      return { width: totalWidth, nodeX }
    }

    const subtreeWidth = this.getSubtreeWidth(node, 0)
    assignPositions(node, 0, 50, 0, 0, subtreeWidth)

    // Fit tree to viewport width
    const minX = nodes.length > 0 ? Math.min(...nodes.map(n => n.x)) : 0
    const maxX = nodes.length > 0 ? Math.max(...nodes.map(n => n.x)) : 0
    const treeWidth = maxX - minX
    
    // Scale to fit viewport with padding
    const padding = 100
    const availableWidth = viewportWidth - (2 * padding)
    const scale = treeWidth > availableWidth ? availableWidth / treeWidth : 1
    
    // Scale and center
    if (scale !== 1) {
      const centerX = (minX + maxX) / 2
      nodes.forEach(n => {
        n.x = ((n.x - centerX) * scale) + centerX
      })
      edges.forEach(e => {
        e.from.x = ((e.from.x - centerX) * scale) + centerX
        e.to.x = ((e.to.x - centerX) * scale) + centerX
      })
    }
    
    // Center in viewport
    const finalMinX = Math.min(...nodes.map(n => n.x))
    const finalMaxX = Math.max(...nodes.map(n => n.x))
    const finalCenterX = (finalMinX + finalMaxX) / 2
    const offsetX = viewportWidth / 2 - finalCenterX

    nodes.forEach(n => {
      n.x += offsetX
    })

    edges.forEach(e => {
      e.from.x += offsetX
      e.to.x += offsetX
    })

    return { nodes, edges }
  }

  getSubtreeWidth(node, level) {
    if (!node) return 0
    if (!node.left && !node.right) return 150
    
    const leftWidth = this.getSubtreeWidth(node.left, level + 1)
    const rightWidth = this.getSubtreeWidth(node.right, level + 1)
    
    return Math.max(leftWidth + rightWidth, 150)
  }
}

export default function IntervalTreeVisualizer() {
  const [tree, setTree] = useState(new IntervalTree())
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [searchStart, setSearchStart] = useState('')
  const [searchEnd, setSearchEnd] = useState('')
  const [searchResult, setSearchResult] = useState(null)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const containerRef = useRef(null)

  useEffect(() => {
    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const delta = e.deltaY * -0.001
        setZoom(prev => Math.min(Math.max(0.3, prev + delta), 3))
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false })
      return () => container.removeEventListener('wheel', handleWheel)
    }
  }, [])

  const showMessage = (text, type = 'info') => {
    setMessage(text)
    setMessageType(type)
    setTimeout(() => setMessage(''), 3000)
  }

  const handleInsert = () => {
    const startVal = parseInt(start)
    const endVal = parseInt(end)

    if (isNaN(startVal) || isNaN(endVal)) {
      showMessage('Please enter valid start and end values', 'error')
      return
    }

    if (startVal > endVal) {
      showMessage('Start value must be less than or equal to end value', 'error')
      return
    }

    const newTree = new IntervalTree()
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth * 0.95 : 800
    const currentNodes = tree.getTreeLayout(tree.root, viewportWidth).nodes
    currentNodes.forEach(node => {
      if (node.interval) {
        newTree.insertInterval(node.interval)
      }
    })
    newTree.insertInterval([startVal, endVal])
    setTree(newTree)
    showMessage(`Interval [${startVal}, ${endVal}] inserted successfully!`, 'success')
    setStart('')
    setEnd('')
    setSearchResult(null)
  }

  const handleDelete = () => {
    const startVal = parseInt(start)
    const endVal = parseInt(end)

    if (isNaN(startVal) || isNaN(endVal)) {
      showMessage('Please enter valid start and end values', 'error')
      return
    }

    const newTree = new IntervalTree()
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth * 0.95 : 800
    const currentNodes = tree.getTreeLayout(tree.root, viewportWidth).nodes
    currentNodes.forEach(node => {
      if (node.interval) {
        newTree.insertInterval(node.interval)
      }
    })
    newTree.deleteInterval([startVal, endVal])
    setTree(newTree)
    showMessage(`Interval [${startVal}, ${endVal}] deleted successfully!`, 'success')
    setStart('')
    setEnd('')
    setSearchResult(null)
  }

  const handleSearch = () => {
    const startVal = parseInt(searchStart)
    const endVal = parseInt(searchEnd)

    if (isNaN(startVal) || isNaN(endVal)) {
      showMessage('Please enter valid search start and end values', 'error')
      return
    }

    const result = tree.searchInterval([startVal, endVal])
    if (result) {
      setSearchResult(result.interval)
      showMessage(`Found overlapping interval: [${result.interval[0]}, ${result.interval[1]}]`, 'success')
    } else {
      setSearchResult(null)
      showMessage('No overlapping interval found', 'info')
    }
  }

  const handleMouseDown = (e) => {
    if (e.button === 0 && zoom > 1) {
      setIsPanning(true)
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }

  const handleMouseMove = (e) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsPanning(false)
  }

  const resetView = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth * 0.95 : 800
  const treeLayout = tree.getTreeLayout(tree.root, viewportWidth)
  const treeNodes = treeLayout.nodes
  const treeEdges = treeLayout.edges
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 mb-2">
            Interval Tree Visualizer
          </h1>
          <p className="text-gray-600">Interactive visualization with zoom & pan support</p>
        </div>

        {message && (
          <div className={`mb-4 mx-auto max-w-2xl p-3 rounded-lg shadow-lg transition-opacity ${
            messageType === 'success' ? 'bg-green-100 text-green-800' :
            messageType === 'error' ? 'bg-red-100 text-red-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-4">
            <h2 className="text-xl font-bold mb-3 flex items-center">
              <span className="mr-2">➕</span> Insert / Delete
            </h2>
            <div className="space-y-3">
              <input
                type="number"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Start"
              />
              <input
                type="number"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="End"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleInsert}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition"
                >
                  Insert
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4">
            <h2 className="text-xl font-bold mb-3 flex items-center">
              <span className="mr-2">🔍</span> Search
            </h2>
            <div className="space-y-3">
              <input
                type="number"
                value={searchStart}
                onChange={(e) => setSearchStart(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Start"
              />
              <input
                type="number"
                value={searchEnd}
                onChange={(e) => setSearchEnd(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="End"
              />
              <button
                onClick={handleSearch}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition"
              >
                Search
              </button>
              {searchResult && (
                <div className="bg-green-50 border border-green-200 rounded p-2">
                  <p className="text-sm text-green-800">
                    Found: [{searchResult[0]}, {searchResult[1]}]
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg p-4 text-white">
            <h2 className="text-xl font-bold mb-3">ℹ️ Controls</h2>
            <ul className="space-y-1 text-sm">
              <li>• Ctrl + Scroll to zoom</li>
              <li>• Drag to pan</li>
              <li>• Click to reset view</li>
              <li>• Max endpoint shown per node</li>
            </ul>
            <div className="mt-3 pt-3 border-t border-white/30">
              <button
                onClick={resetView}
                className="w-full bg-white/20 hover:bg-white/30 py-2 rounded-lg transition text-sm"
              >
                Reset View
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-2xl p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold flex items-center">
              <span className="mr-2">🌳</span> Tree Visualization
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Zoom: {Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom(prev => Math.max(0.3, prev - 0.1))}
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
              >
                -
              </button>
              <button
                onClick={() => setZoom(prev => Math.min(3, prev + 0.1))}
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
              >
                +
              </button>
            </div>
          </div>

          {treeNodes.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <p className="text-xl">Tree is empty. Insert some intervals!</p>
            </div>
          ) : (
            <div
              ref={containerRef}
              className="relative overflow-hidden border-2 border-gray-200 rounded-lg bg-gray-50"
              style={{ height: '600px', cursor: isPanning ? 'grabbing' : 'grab' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <svg
                width="100%"
                height="100%"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: '0 0'
                }}
              >
                {treeEdges.map((edge, idx) => (
                  <line
                    key={`edge-${idx}`}
                    x1={edge.from.x}
                    y1={edge.from.y}
                    x2={edge.to.x}
                    y2={edge.to.y}
                    stroke="#94a3b8"
                    strokeWidth="2"
                  />
                ))}

                {treeNodes.map((node) => (
                  <g key={node.id}>
                    <rect
                      x={node.x - 60}
                      y={node.y - 40}
                      width="120"
                      height="80"
                      rx="8"
                      fill={searchResult && node.interval[0] === searchResult[0] && node.interval[1] === searchResult[1]
                        ? "#10b981"
                        : "#3b82f6"}
                      stroke="#1e40af"
                      strokeWidth="2"
                    />
                    <text
                      x={node.x}
                      y={node.y + 5}
                      textAnchor="middle"
                      fill="white"
                      fontSize="13"
                      fontWeight="bold"
                    >
                      [{node.interval[0]}, {node.interval[1]}]
                    </text>
                    <text
                      x={node.x}
                      y={node.y + 25}
                      textAnchor="middle"
                      fill="white"
                      fontSize="11"
                    >
                      max: {node.max}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
