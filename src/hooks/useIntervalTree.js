import { useState } from 'react'
import { RedBlackIntervalTree } from '../dataStructure/RedBlackIntervalTree'

export const useIntervalTree = () => {
  const [tree, setTree] = useState(new RedBlackIntervalTree())
  const [searchResult, setSearchResult] = useState(null)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')

  const showMessage = (text, type = 'info') => {
    setMessage(text)
    setMessageType(type)
    setTimeout(() => setMessage(''), 3000)
  }

  const insertInterval = (start, end) => {
    if (isNaN(start) || isNaN(end) || start > end) {
      showMessage('Please enter valid start and end values', 'error')
      return
    }

    const newTree = new RedBlackIntervalTree()
    tree.getAllIntervals().forEach(interval => {
      newTree.insertInterval(interval)
    })
    newTree.insertInterval([start, end])
    
    setTree(newTree)
    showMessage(`Interval [${start}, ${end}] inserted successfully!`, 'success')
    setSearchResult(null)
  }

  const deleteInterval = (start, end) => {
    if (isNaN(start) || isNaN(end)) {
      showMessage('Please enter valid start and end values', 'error')
      return
    }

    const newTree = new RedBlackIntervalTree()
    tree.getAllIntervals().forEach(interval => {
      if (interval[0] !== start || interval[1] !== end) {
        newTree.insertInterval(interval)
      }
    })
    
    setTree(newTree)
    showMessage(`Interval [${start}, ${end}] deleted successfully!`, 'success')
    setSearchResult(null)
  }

  const searchInterval = (start, end) => {
    if (isNaN(start) || isNaN(end)) {
      showMessage('Please enter valid search start and end values', 'error')
      return
    }

    const result = tree.searchInterval([start, end])
    if (result) {
      setSearchResult(result.interval)
      showMessage(`Found overlapping interval: [${result.interval[0]}, ${result.interval[1]}]`, 'success')
    } else {
      setSearchResult(null)
      showMessage('No overlapping interval found', 'info')
    }
  }

  return {
    tree,
    searchResult,
    message,
    messageType,
    insertInterval,
    deleteInterval,
    searchInterval
  }
}
