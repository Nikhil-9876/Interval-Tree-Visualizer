import { useState, useRef, useEffect } from 'react'
import { useIntervalTree } from '../hooks/useIntervalTree'

export default function IntervalTreeVisualizer() {
  const {
    tree,
    searchResult,
    message,
    messageType,
    insertInterval,
    deleteInterval,
    searchInterval
  } = useIntervalTree()

  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [searchStart, setSearchStart] = useState('')
  const [searchEnd, setSearchEnd] = useState('')
  const [zoom, setZoom] = useState(0.8)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const containerRef = useRef(null)

  useEffect(() => {
    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const delta = e.deltaY * -0.001
        setZoom(prev => Math.min(Math.max(0.2, prev + delta), 2))
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false })
      return () => container.removeEventListener('wheel', handleWheel)
    }
  }, [])

  const handleInsert = () => {
    const startVal = parseInt(start)
    const endVal = parseInt(end)
    insertInterval(startVal, endVal)
    setStart('')
    setEnd('')
  }

  const handleDelete = () => {
    const startVal = parseInt(start)
    const endVal = parseInt(end)
    deleteInterval(startVal, endVal)
    setStart('')
    setEnd('')
  }

  const handleSearch = () => {
    const startVal = parseInt(searchStart)
    const endVal = parseInt(searchEnd)
    searchInterval(startVal, endVal)
  }

  const handleMouseDown = (e) => {
    if (e.button === 0) {
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
    setZoom(0.8)
    setPan({ x: 0, y: 0 })
  }

  // Get intervals for visualization
  const intervals = tree.getAllIntervals()
  
  // Enhanced tree layout with proper spacing for large trees
  const getEnhancedTreeLayout = () => {
    if (tree.root === tree.NIL) {
      return { nodes: [], edges: [], canvasWidth: 1200, canvasHeight: 800 }
    }
    
    const nodes = []
    const edges = []
    
    // Enhanced spacing for larger trees
    const nodeWidth = 140
    const nodeHeight = 90
    const minVerticalSpacing = 120
    const minHorizontalSpacing = 180
    
    // Calculate tree dimensions first
    const getTreeInfo = (node) => {
      if (node === tree.NIL) return { width: 0, height: 0, nodeCount: 0 }
      
      const leftInfo = getTreeInfo(node.left)
      const rightInfo = getTreeInfo(node.right)
      
      const childrenWidth = leftInfo.width + rightInfo.width + 
        (leftInfo.nodeCount > 0 && rightInfo.nodeCount > 0 ? minHorizontalSpacing : 0)
      
      return {
        width: Math.max(nodeWidth, childrenWidth),
        height: Math.max(leftInfo.height, rightInfo.height) + minVerticalSpacing,
        nodeCount: leftInfo.nodeCount + rightInfo.nodeCount + 1
      }
    }
    
    let nodeCounter = 0
    
    // Improved positioning algorithm to prevent overlaps
    const positionNodes = (node, x, y, level, availableWidth) => {
      if (node === tree.NIL) return null
      
      const leftInfo = getTreeInfo(node.left)
      const rightInfo = getTreeInfo(node.right)
      
      const nodeData = {
        id: `node-${nodeCounter}`,
        interval: node.interval,
        max: node.max,
        color: node.color,
        x: x,
        y: y,
        level,
        nodeIndex: nodeCounter++
      }
      
      nodes.push(nodeData)
      const currentIndex = nodeData.nodeIndex
      
      const childY = y + minVerticalSpacing
      
      // Calculate child positions with adequate spacing
      if (node.left !== tree.NIL && node.right !== tree.NIL) {
        const totalChildWidth = leftInfo.width + rightInfo.width + minHorizontalSpacing
        const leftStart = x - totalChildWidth / 2
        const leftX = leftStart + leftInfo.width / 2
        const rightX = leftStart + leftInfo.width + minHorizontalSpacing + rightInfo.width / 2
        
        const leftChild = positionNodes(node.left, leftX, childY, level + 1, leftInfo.width)
        const rightChild = positionNodes(node.right, rightX, childY, level + 1, rightInfo.width)
        
        if (leftChild) {
          edges.push({
            from: { x, y: y + nodeHeight / 2, nodeIndex: currentIndex },
            to: { x: leftChild.x, y: leftChild.y - nodeHeight / 2, nodeIndex: leftChild.nodeIndex },
            id: `edge-${currentIndex}-${leftChild.nodeIndex}`
          })
        }
        
        if (rightChild) {
          edges.push({
            from: { x, y: y + nodeHeight / 2, nodeIndex: currentIndex },
            to: { x: rightChild.x, y: rightChild.y - nodeHeight / 2, nodeIndex: rightChild.nodeIndex },
            id: `edge-${currentIndex}-${rightChild.nodeIndex}`
          })
        }
      } else if (node.left !== tree.NIL) {
        const leftX = x - minHorizontalSpacing / 2
        const leftChild = positionNodes(node.left, leftX, childY, level + 1, leftInfo.width)
        
        if (leftChild) {
          edges.push({
            from: { x, y: y + nodeHeight / 2, nodeIndex: currentIndex },
            to: { x: leftChild.x, y: leftChild.y - nodeHeight / 2, nodeIndex: leftChild.nodeIndex },
            id: `edge-${currentIndex}-${leftChild.nodeIndex}`
          })
        }
      } else if (node.right !== tree.NIL) {
        const rightX = x + minHorizontalSpacing / 2
        const rightChild = positionNodes(node.right, rightX, childY, level + 1, rightInfo.width)
        
        if (rightChild) {
          edges.push({
            from: { x, y: y + nodeHeight / 2, nodeIndex: currentIndex },
            to: { x: rightChild.x, y: rightChild.y - nodeHeight / 2, nodeIndex: rightChild.nodeIndex },
            id: `edge-${currentIndex}-${rightChild.nodeIndex}`
          })
        }
      }
      
      return nodeData
    }
    
    const rootInfo = getTreeInfo(tree.root)
    
    // Dynamic canvas sizing based on tree size
    const padding = 150
    const canvasWidth = Math.max(1400, rootInfo.width + padding * 2)
    const canvasHeight = Math.max(900, rootInfo.height + padding * 2)
    
    positionNodes(tree.root, canvasWidth / 2, padding, 0, rootInfo.width)
    
    return { nodes, edges, canvasWidth, canvasHeight }
  }
  
  // Enhanced interval visualization with scrolling
  const createIntervalVisualization = () => {
    if (intervals.length === 0) return null

    const minStart = Math.min(...intervals.map(i => i[0]))
    const maxEnd = Math.max(...intervals.map(i => i[1]))
    const range = maxEnd - minStart || 10
    const padding = range * 0.1
    const totalRange = range + 2 * padding
    const svgWidth = 1000
    const lineHeight = 35
    const headerHeight = 60
    
    // Dynamic height based on number of intervals
    const contentHeight = Math.max(300, intervals.length * lineHeight + 100)
    const maxVisibleHeight = 400
    const needsScrolling = contentHeight > maxVisibleHeight
    
    const startY = headerHeight

    return (
      <div className="bg-white rounded-xl shadow-lg p-4 mt-6">
        <h2 className="text-2xl font-bold mb-4">📊 Interval Overlap Visualization</h2>
        
        <div 
          className={`border rounded ${needsScrolling ? 'overflow-y-auto' : ''}`}
          style={{ 
            maxHeight: needsScrolling ? `${maxVisibleHeight}px` : 'auto',
            height: needsScrolling ? `${maxVisibleHeight}px` : `${contentHeight}px`
          }}
        >
          <svg 
            width={svgWidth} 
            height={contentHeight}
            className="w-full"
          >
            {/* Grid lines */}
            {Array.from({ length: 11 }, (_, i) => {
              const x = (i * svgWidth) / 10
              const value = minStart - padding + (i * totalRange) / 10
              return (
                <g key={i}>
                  <line
                    x1={x}
                    y1={30}
                    x2={x}
                    y2={contentHeight - 20}
                    stroke="#e5e7eb"
                    strokeDasharray="2,2"
                  />
                  <text
                    x={x}
                    y={20}
                    textAnchor="middle"
                    fontSize="11"
                    fill="#6b7280"
                    fontWeight="500"
                  >
                    {Math.round(value)}
                  </text>
                </g>
              )
            })}

            {/* Intervals as horizontal bars */}
            {intervals.map((interval, index) => {
              const startX = ((interval[0] - minStart + padding) / totalRange) * svgWidth
              const endX = ((interval[1] - minStart + padding) / totalRange) * svgWidth
              const width = Math.max(endX - startX, 20) // Minimum width for visibility
              const y = startY + (index * lineHeight)
              
              const isHighlighted = searchResult && 
                interval[0] === searchResult[0] && 
                interval[1] === searchResult[1]
              
              return (
                <g key={index}>
                  {/* Interval bar */}
                  <rect
                    x={startX}
                    y={y}
                    width={width}
                    height={28}
                    fill={isHighlighted ? "#10b981" : "#3b82f6"}
                    fillOpacity="0.8"
                    stroke={isHighlighted ? "#059669" : "#1d4ed8"}
                    strokeWidth="2"
                    rx="4"
                  />
                  
                  {/* Interval label */}
                  <text
                    x={startX + width / 2}
                    y={y + 18}
                    textAnchor="middle"
                    fontSize="12"
                    fill="white"
                    fontWeight="bold"
                  >
                    [{interval[0]}, {interval[1]}]
                  </text>
                  
                  {/* Start point marker */}
                  <circle
                    cx={startX}
                    cy={y + 14}
                    r="5"
                    fill={isHighlighted ? "#059669" : "#1d4ed8"}
                    stroke="white"
                    strokeWidth="2"
                  />
                  
                  {/* End point marker */}
                  <circle
                    cx={endX}
                    cy={y + 14}
                    r="5"
                    fill={isHighlighted ? "#059669" : "#1d4ed8"}
                    stroke="white"
                    strokeWidth="2"
                  />
                  
                  {/* Index label */}
                  <text
                    x={10}
                    y={y + 18}
                    fontSize="10"
                    fill="#6b7280"
                    fontWeight="bold"
                  >
                    #{index + 1}
                  </text>
                </g>
              )
            })}

            {/* Search interval overlay */}
            {searchStart && searchEnd && !isNaN(parseInt(searchStart)) && !isNaN(parseInt(searchEnd)) && (
              <g>
                <rect
                  x={((parseInt(searchStart) - minStart + padding) / totalRange) * svgWidth}
                  y={startY - 10}
                  width={Math.max(((parseInt(searchEnd) - parseInt(searchStart)) / totalRange) * svgWidth, 20)}
                  height={intervals.length * lineHeight + 30}
                  fill="rgba(239, 68, 68, 0.15)"
                  stroke="#ef4444"
                  strokeWidth="2"
                  strokeDasharray="8,4"
                  rx="6"
                />
                <text
                  x={((parseInt(searchStart) + parseInt(searchEnd)) / 2 - minStart + padding) / totalRange * svgWidth}
                  y={startY - 20}
                  textAnchor="middle"
                  fontSize="13"
                  fill="#ef4444"
                  fontWeight="bold"
                >
                  🔍 Search: [{searchStart}, {searchEnd}]
                </text>
              </g>
            )}
          </svg>
        </div>
        
        <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
          <div className="grid grid-cols-3 gap-4">
            <p>• <span className="inline-block w-3 h-3 bg-blue-600 rounded mr-1"></span>Stored intervals</p>
            <p>• <span className="inline-block w-3 h-3 bg-green-600 rounded mr-1"></span>Search results</p>
            <p>• <span className="inline-block w-3 h-3 border-2 border-red-500 border-dashed rounded mr-1"></span>Search query</p>
          </div>
          {needsScrolling && (
            <p className="mt-2 text-xs text-blue-600">📜 Scroll to view all {intervals.length} intervals</p>
          )}
        </div>
      </div>
    )
  }

  const treeLayout = getEnhancedTreeLayout()
  const treeNodes = treeLayout.nodes
  const treeEdges = treeLayout.edges
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 mb-2">
            Interval Tree Visualizer
          </h1>
          <p className="text-gray-600">Self-balancing binary search tree for interval overlap queries</p>
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
          {/* Insert/Delete Panel */}
          <div className="bg-white rounded-xl shadow-lg p-4">
            <h2 className="text-xl font-bold mb-3">➕ Insert / Delete</h2>
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
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Insert
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>

          {/* Search Panel */}
          <div className="bg-white rounded-xl shadow-lg p-4">
            <h2 className="text-xl font-bold mb-3">🔍 Search</h2>
            <div className="space-y-3">
              <input
                type="number"
                value={searchStart}
                onChange={(e) => setSearchStart(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="Start"
              />
              <input
                type="number"
                value={searchEnd}
                onChange={(e) => setSearchEnd(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="End"
              />
              <button
                onClick={handleSearch}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Search Overlap
              </button>
              {searchResult && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800 font-medium">
                    ✅ Found: [{searchResult[0]}, {searchResult[1]}]
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Stats Panel */}
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg p-4 text-white">
            <h2 className="text-xl font-bold mb-3">ℹ️ Tree Stats</h2>
            <div className="space-y-2 text-sm mb-4">
              <p>• Total Nodes: <strong>{treeNodes.length}</strong></p>
              <p>• Tree Height: <strong>{tree.getHeight()}</strong></p>
              <p>• Canvas Size: <strong>{Math.round(treeLayout.canvasWidth)}×{Math.round(treeLayout.canvasHeight)}</strong></p>
              <p>• Max Endpoint: <strong>{intervals.length > 0 ? Math.max(...intervals.map(i => i[1])) : 'N/A'}</strong></p>
            </div>
            <ul className="space-y-1 text-xs mb-4 opacity-90">
              <li>• Ctrl + Scroll to zoom</li>
              <li>• Drag canvas to pan</li>
              <li>• Auto-sizing for large trees</li>
            </ul>
            <button
              onClick={resetView}
              className="w-full bg-white/20 hover:bg-white/30 py-2 rounded-lg transition-colors"
            >
              Reset View
            </button>
          </div>
        </div>

        {/* Enhanced Tree Visualization */}
        <div className="bg-white rounded-xl shadow-2xl p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">🌳 Tree Structure ({treeNodes.length} nodes)</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Zoom: {Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom(prev => Math.max(0.2, prev - 0.1))}
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
              >
                −
              </button>
              <button
                onClick={() => setZoom(prev => Math.min(2, prev + 0.1))}
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {treeNodes.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <div className="text-6xl mb-4">🌱</div>
              <p className="text-xl">Tree is empty. Insert some intervals!</p>
            </div>
          ) : (
            <div
              ref={containerRef}
              className="relative overflow-auto border-2 border-gray-200 rounded-lg bg-gradient-to-b from-gray-50 to-gray-100"
              style={{ 
                height: '700px', 
                cursor: isPanning ? 'grabbing' : 'grab',
                scrollbarWidth: 'thin'
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <svg
                width={treeLayout.canvasWidth}
                height={treeLayout.canvasHeight}
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: '0 0'
                }}
              >
                {/* Enhanced edges with better styling */}
                {treeEdges.map((edge) => {
                  const fromNode = treeNodes[edge.from.nodeIndex]
                  const toNode = treeNodes[edge.to.nodeIndex]
                  return (
                    <line
                      key={edge.id}
                      x1={fromNode.x}
                      y1={fromNode.y + 45}
                      x2={toNode.x}
                      y2={toNode.y - 45}
                      stroke="#4b5563"
                      strokeWidth="3"
                      strokeOpacity="0.7"
                      strokeLinecap="round"
                    />
                  )
                })}

                {/* Enhanced nodes with better spacing and visibility */}
                {treeNodes.map((node) => {
                  const isHighlighted = searchResult && 
                    node.interval[0] === searchResult[0] && 
                    node.interval[1] === searchResult[1]
                  
                  const fillColor = isHighlighted ? "#10b981" : 
                    node.color === 'RED' ? "#dc2626" : "#374151"
                  
                  return (
                    <g key={node.id}>
                      {/* Node shadow */}
                      <rect
                        x={node.x - 67}
                        y={node.y - 37}
                        width={134}
                        height={84}
                        rx={12}
                        fill="rgba(0,0,0,0.1)"
                      />
                      
                      {/* Main node */}
                      <rect
                        x={node.x - 70}
                        y={node.y - 40}
                        width={140}
                        height={80}
                        rx={10}
                        fill={fillColor}
                        stroke={isHighlighted ? "#059669" : "#1e40af"}
                        strokeWidth="3"
                      />
                      
                      {/* Interval text */}
                      <text
                        x={node.x}
                        y={node.y + 2}
                        textAnchor="middle"
                        fill="white"
                        fontSize="14"
                        fontWeight="bold"
                      >
                        [{node.interval[0]}, {node.interval[1]}]
                      </text>
                      
                      {/* Max value */}
                      <text
                        x={node.x}
                        y={node.y + 22}
                        textAnchor="middle"
                        fill="white"
                        fontSize="12"
                        opacity="0.9"
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

        {/* Enhanced Interval Visualization */}
        {createIntervalVisualization()}
      </div>
    </div>
  )
}
