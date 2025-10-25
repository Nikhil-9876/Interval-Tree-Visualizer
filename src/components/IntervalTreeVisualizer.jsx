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

  // OPTIMIZED tree layout - compact, non-overlapping, all nodes visible
  getTreeLayout(node = this.root) {
    if (!node) return { nodes: [], edges: [], canvasWidth: 800, canvasHeight: 600 }
    
    const nodes = []
    const edges = []
    const nodeWidth = 120
    const nodeHeight = 80
    const verticalSpacing = 100
    const horizontalSpacing = 40
    
    // First pass: Calculate positions using post-order traversal for accurate subtree widths
    const calculateSubtreeInfo = (n) => {
      if (!n) return { width: 0, height: 0 }
      
      const leftInfo = calculateSubtreeInfo(n.left)
      const rightInfo = calculateSubtreeInfo(n.right)
      
      const width = Math.max(
        nodeWidth,
        leftInfo.width + rightInfo.width + (leftInfo.width > 0 && rightInfo.width > 0 ? horizontalSpacing : 0)
      )
      
      const height = Math.max(leftInfo.height, rightInfo.height) + nodeHeight + verticalSpacing
      
      return { width, height, leftWidth: leftInfo.width, rightWidth: rightInfo.width }
    }
    
    let nodeCounter = 0
    
    // Second pass: Assign actual positions
    const assignPositions = (n, x, y, level) => {
      if (!n) return null
      
      // Calculate subtree widths for this node
      const leftInfo = calculateSubtreeInfo(n.left)
      const rightInfo = calculateSubtreeInfo(n.right)
      
      // Position current node
      const nodeData = {
        id: `node-${nodeCounter}`,
        interval: n.interval,
        max: n.max,
        x: x,
        y: y,
        level,
        nodeIndex: nodeCounter++
      }
      
      nodes.push(nodeData)
      const currentIndex = nodeData.nodeIndex
      
      // Calculate child positions
      if (n.left && n.right) {
        // Both children exist
        const leftX = x - (rightInfo.width / 2 + horizontalSpacing / 2)
        const rightX = x + (leftInfo.width / 2 + horizontalSpacing / 2)
        
        const childY = y + nodeHeight + verticalSpacing
        
        const leftChild = assignPositions(n.left, leftX, childY, level + 1)
        const rightChild = assignPositions(n.right, rightX, childY, level + 1)
        
        if (leftChild) {
          edges.push({
            from: { x: x, y: y + nodeHeight / 2, nodeIndex: currentIndex },
            to: { x: leftChild.x, y: leftChild.y - nodeHeight / 2, nodeIndex: leftChild.nodeIndex },
            id: `edge-${currentIndex}-${leftChild.nodeIndex}`
          })
        }
        
        if (rightChild) {
          edges.push({
            from: { x: x, y: y + nodeHeight / 2, nodeIndex: currentIndex },
            to: { x: rightChild.x, y: rightChild.y - nodeHeight / 2, nodeIndex: rightChild.nodeIndex },
            id: `edge-${currentIndex}-${rightChild.nodeIndex}`
          })
        }
      } else if (n.left) {
        // Only left child
        const leftX = x - nodeWidth / 2
        const childY = y + nodeHeight + verticalSpacing
        const leftChild = assignPositions(n.left, leftX, childY, level + 1)
        
        if (leftChild) {
          edges.push({
            from: { x: x, y: y + nodeHeight / 2, nodeIndex: currentIndex },
            to: { x: leftChild.x, y: leftChild.y - nodeHeight / 2, nodeIndex: leftChild.nodeIndex },
            id: `edge-${currentIndex}-${leftChild.nodeIndex}`
          })
        }
      } else if (n.right) {
        // Only right child
        const rightX = x + nodeWidth / 2
        const childY = y + nodeHeight + verticalSpacing
        const rightChild = assignPositions(n.right, rightX, childY, level + 1)
        
        if (rightChild) {
          edges.push({
            from: { x: x, y: y + nodeHeight / 2, nodeIndex: currentIndex },
            to: { x: rightChild.x, y: rightChild.y - nodeHeight / 2, nodeIndex: rightChild.nodeIndex },
            id: `edge-${currentIndex}-${rightChild.nodeIndex}`
          })
        }
      }
      
      return nodeData
    }
    
    // Get root info and calculate canvas size
    const rootInfo = calculateSubtreeInfo(node)
    const padding = 100
    const canvasWidth = rootInfo.width + padding * 2
    const canvasHeight = rootInfo.height + padding * 2
    
    // Start positioning from center top
    assignPositions(node, canvasWidth / 2, padding, 0)
    
    return { 
      nodes, 
      edges, 
      canvasWidth: Math.max(canvasWidth, 1000), 
      canvasHeight: Math.max(canvasHeight, 600)
    }
  }

  // Get all intervals in the tree (for persistence)
  getAllIntervals() {
    const intervals = []
    const traverse = (node) => {
      if (!node) return
      traverse(node.left)
      intervals.push([...node.interval])
      traverse(node.right)
    }
    traverse(this.root)
    return intervals
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
  const [isDraggingNode, setIsDraggingNode] = useState(false)
  const [draggedNodeId, setDraggedNodeId] = useState(null)
  const [nodePositions, setNodePositions] = useState({})
  const containerRef = useRef(null)
  const svgRef = useRef(null)

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

    // Store all existing intervals
    const existingIntervals = tree.getAllIntervals()
    
    // Create new tree and rebuild with all intervals
    const newTree = new IntervalTree()
    existingIntervals.forEach(interval => {
      newTree.insertInterval(interval)
    })
    newTree.insertInterval([startVal, endVal])
    
    setTree(newTree)
    setNodePositions({})
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

    // Store all existing intervals
    const existingIntervals = tree.getAllIntervals()
    
    // Create new tree and rebuild with all intervals except the deleted one
    const newTree = new IntervalTree()
    existingIntervals.forEach(interval => {
      if (interval[0] !== startVal || interval[1] !== endVal) {
        newTree.insertInterval(interval)
      }
    })
    
    setTree(newTree)
    setNodePositions({})
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
    if (e.button === 0 && !e.target.closest('.node-draggable')) {
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
    } else if (isDraggingNode && draggedNodeId) {
      const svg = svgRef.current
      if (svg) {
        const pt = svg.createSVGPoint()
        pt.x = e.clientX
        pt.y = e.clientY
        const svgP = pt.matrixTransform(svg.getScreenCTM().inverse())
        
        setNodePositions(prev => ({
          ...prev,
          [draggedNodeId]: {
            x: svgP.x,
            y: svgP.y
          }
        }))
      }
    }
  }

  const handleMouseUp = () => {
    setIsPanning(false)
    setIsDraggingNode(false)
    setDraggedNodeId(null)
  }

  const handleNodeMouseDown = (e, nodeId) => {
    e.stopPropagation()
    setIsDraggingNode(true)
    setDraggedNodeId(nodeId)
  }

  const resetView = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const resetPositions = () => {
    setNodePositions({})
    showMessage('Node positions reset!', 'info')
  }

  const treeLayout = tree.getTreeLayout(tree.root)
  const treeNodes = treeLayout.nodes
  const treeEdges = treeLayout.edges
  const canvasWidth = treeLayout.canvasWidth
  const canvasHeight = treeLayout.canvasHeight

  const getNodePosition = (node) => {
    return nodePositions[node.id] || { x: node.x, y: node.y }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 mb-2">
            Interval Tree Visualizer
          </h1>
          <p className="text-gray-600">Interactive visualization - All nodes guaranteed visible</p>
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
            <h2 className="text-xl font-bold mb-3">ℹ️ Controls & Stats</h2>
            <div className="space-y-2 text-sm mb-3">
              <p>• Total Nodes: <strong>{treeNodes.length}</strong></p>
              <p>• Tree Height: <strong>{tree.getHeight(tree.root)}</strong></p>
            </div>
            <ul className="space-y-1 text-sm mb-3">
              <li>• Ctrl + Scroll to zoom</li>
              <li>• Drag canvas to pan</li>
              <li>• Drag nodes to reposition</li>
            </ul>
            <div className="pt-3 border-t border-white/30 space-y-2">
              <button
                onClick={resetView}
                className="w-full bg-white/20 hover:bg-white/30 py-2 rounded-lg transition text-sm"
              >
                Reset View
              </button>
              <button
                onClick={resetPositions}
                className="w-full bg-white/20 hover:bg-white/30 py-2 rounded-lg transition text-sm"
              >
                Reset Positions
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
              className="relative overflow-auto border-2 border-gray-200 rounded-lg bg-gray-50"
              style={{ 
                height: '600px', 
                cursor: isPanning ? 'grabbing' : isDraggingNode ? 'grabbing' : 'grab' 
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <svg
                ref={svgRef}
                width={canvasWidth}
                height={canvasHeight}
                viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: '0 0',
                  minWidth: '100%',
                  minHeight: '100%'
                }}
              >
                {/* Render edges first so they appear behind nodes */}
                {treeEdges.map((edge, idx) => {
                  const fromNode = treeNodes[edge.from.nodeIndex]
                  const toNode = treeNodes[edge.to.nodeIndex]
                  
                  if (!fromNode || !toNode) return null
                  
                  const fromPos = getNodePosition(fromNode)
                  const toPos = getNodePosition(toNode)
                  
                  return (
                    <line
                      key={edge.id}
                      x1={fromPos.x}
                      y1={fromPos.y + 40}
                      x2={toPos.x}
                      y2={toPos.y - 40}
                      stroke="#2563eb"
                      strokeWidth="3"
                      strokeOpacity="0.8"
                    />
                  )
                })}

                {/* Render nodes */}
                {treeNodes.map((node) => {
                  const pos = getNodePosition(node)
                  const isHighlighted = searchResult && 
                    node.interval[0] === searchResult[0] && 
                    node.interval[1] === searchResult[1]
                  
                  return (
                    <g
                      key={node.id}
                      className="node-draggable"
                      onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                      style={{ cursor: 'move' }}
                    >
                      <rect
                        x={pos.x - 60}
                        y={pos.y - 40}
                        width="120"
                        height="80"
                        rx="8"
                        fill={isHighlighted ? "#10b981" : "#3b82f6"}
                        stroke="#1e40af"
                        strokeWidth="2"
                      />
                      <text
                        x={pos.x}
                        y={pos.y + 5}
                        textAnchor="middle"
                        fill="white"
                        fontSize="13"
                        fontWeight="bold"
                        pointerEvents="none"
                      >
                        [{node.interval[0]}, {node.interval[1]}]
                      </text>
                      <text
                        x={pos.x}
                        y={pos.y + 25}
                        textAnchor="middle"
                        fill="white"
                        fontSize="11"
                        pointerEvents="none"
                      >
                        max: {node.max}
                      </text>
                    </g>
                  )
                })}
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
