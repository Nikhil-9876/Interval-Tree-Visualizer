// Red-Black Tree Node class
class RBITreeNode {
  constructor(interval) {
    this.interval = interval
    this.max = interval[1]
    this.left = null
    this.right = null
    this.parent = null
    this.color = 'RED'
  }
}

// Red-Black Interval Tree class
export class RedBlackIntervalTree {
  constructor() {
    this.NIL = new RBITreeNode([0, 0])
    this.NIL.color = 'BLACK'
    this.NIL.left = this.NIL.right = this.NIL.parent = this.NIL
    this.root = this.NIL
  }

  updateMax(node) {
    if (node === this.NIL) return
    node.max = node.interval[1]
    if (node.left !== this.NIL) node.max = Math.max(node.max, node.left.max)
    if (node.right !== this.NIL) node.max = Math.max(node.max, node.right.max)
  }

  leftRotate(x) {
    const y = x.right
    x.right = y.left
    if (y.left !== this.NIL) y.left.parent = x
    y.parent = x.parent
    if (x.parent === this.NIL) this.root = y
    else if (x === x.parent.left) x.parent.left = y
    else x.parent.right = y
    y.left = x
    x.parent = y
    this.updateMax(x)
    this.updateMax(y)
  }

  rightRotate(x) {
    const y = x.left
    x.left = y.right
    if (y.right !== this.NIL) y.right.parent = x
    y.parent = x.parent
    if (x.parent === this.NIL) this.root = y
    else if (x === x.parent.right) x.parent.right = y
    else x.parent.left = y
    y.right = x
    x.parent = y
    this.updateMax(x)
    this.updateMax(y)
  }

  fixInsert(k) {
    while (k.parent.color === 'RED') {
      if (k.parent === k.parent.parent.left) {
        const u = k.parent.parent.right
        if (u.color === 'RED') {
          k.parent.color = 'BLACK'
          u.color = 'BLACK'
          k.parent.parent.color = 'RED'
          k = k.parent.parent
        } else {
          if (k === k.parent.right) {
            k = k.parent
            this.leftRotate(k)
          }
          k.parent.color = 'BLACK'
          k.parent.parent.color = 'RED'
          this.rightRotate(k.parent.parent)
        }
      } else {
        const u = k.parent.parent.left
        if (u.color === 'RED') {
          k.parent.color = 'BLACK'
          u.color = 'BLACK'
          k.parent.parent.color = 'RED'
          k = k.parent.parent
        } else {
          if (k === k.parent.left) {
            k = k.parent
            this.rightRotate(k)
          }
          k.parent.color = 'BLACK'
          k.parent.parent.color = 'RED'
          this.leftRotate(k.parent.parent)
        }
      }
      if (k === this.root) break
    }
    this.root.color = 'BLACK'
  }

  insertInterval(interval) {
    const newNode = new RBITreeNode(interval)
    newNode.left = this.NIL
    newNode.right = this.NIL
    
    let parent = this.NIL
    let current = this.root
    
    while (current !== this.NIL) {
      parent = current
      if (interval[0] < current.interval[0] || 
          (interval[0] === current.interval[0] && interval[1] < current.interval[1])) {
        current = current.left
      } else {
        current = current.right
      }
    }
    
    newNode.parent = parent
    if (parent === this.NIL) this.root = newNode
    else if (interval[0] < parent.interval[0] || 
             (interval[0] === parent.interval[0] && interval[1] < parent.interval[1])) {
      parent.left = newNode
    } else {
      parent.right = newNode
    }
    
    let updateNode = newNode
    while (updateNode !== this.NIL) {
      this.updateMax(updateNode)
      updateNode = updateNode.parent
    }
    
    if (newNode.parent === this.NIL) {
      newNode.color = 'BLACK'
      return
    }
    if (newNode.parent.parent === this.NIL) return
    this.fixInsert(newNode)
  }

  deleteInterval(interval) {
    let z = this.root
    while (z !== this.NIL) {
      if (interval[0] === z.interval[0] && interval[1] === z.interval[1]) break
      if (interval[0] < z.interval[0] || 
          (interval[0] === z.interval[0] && interval[1] < z.interval[1])) {
        z = z.left
      } else {
        z = z.right
      }
    }
    if (z === this.NIL) return
    // Simplified deletion - rebuild tree without this interval
    const intervals = this.getAllIntervals().filter(int => 
      int[0] !== interval[0] || int[1] !== interval[1]
    )
    this.root = this.NIL
    intervals.forEach(int => this.insertInterval(int))
  }

  searchInterval(interval) {
    return this.search(this.root, interval)
  }

  search(node, interval) {
    if (node === this.NIL) return null
    if (this.doOverlap(node.interval, interval)) return node
    if (node.left !== this.NIL && node.left.max >= interval[0])
      return this.search(node.left, interval)
    return this.search(node.right, interval)
  }

  doOverlap(interval1, interval2) {
    return interval1[0] <= interval2[1] && interval2[0] <= interval1[1]
  }

  getHeight(node = this.root) {
    if (node === this.NIL) return 0
    return Math.max(this.getHeight(node.left), this.getHeight(node.right)) + 1
  }

  getAllIntervals() {
    const intervals = []
    const traverse = (node) => {
      if (node === this.NIL) return
      traverse(node.left)
      intervals.push([...node.interval])
      traverse(node.right)
    }
    traverse(this.root)
    return intervals
  }

  getTreeLayout() {
    if (this.root === this.NIL) {
      return { nodes: [], edges: [], canvasWidth: 800, canvasHeight: 600 }
    }
    
    const nodes = []
    const edges = []
    const nodeWidth = 120
    const nodeHeight = 80
    const verticalSpacing = 100
    const horizontalSpacing = 40
    
    let nodeCounter = 0
    
    const assignPositions = (n, x, y, level) => {
      if (n === this.NIL) return null
      
      const nodeData = {
        id: `node-${nodeCounter}`,
        interval: n.interval,
        max: n.max,
        color: n.color,
        x: x,
        y: y,
        level,
        nodeIndex: nodeCounter++
      }
      
      nodes.push(nodeData)
      const currentIndex = nodeData.nodeIndex
      
      const leftX = x - 150
      const rightX = x + 150
      const childY = y + nodeHeight + verticalSpacing
      
      const leftChild = n.left !== this.NIL ? assignPositions(n.left, leftX, childY, level + 1) : null
      const rightChild = n.right !== this.NIL ? assignPositions(n.right, rightX, childY, level + 1) : null
      
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
      
      return nodeData
    }
    
    const padding = 100
    const canvasWidth = 1200
    const canvasHeight = 800
    
    assignPositions(this.root, canvasWidth / 2, padding, 0)
    
    return { nodes, edges, canvasWidth, canvasHeight }
  }
}
