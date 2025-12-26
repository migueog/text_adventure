'use client'

import { useState } from 'react'
import { rollD3, rollD6, roll2D6 } from '@/lib/utils/dice'

interface DiceRoll {
  type: string
  result: number
  breakdown?: string
  timestamp: string
}

export default function DiceRoller() {
  const [lastRoll, setLastRoll] = useState<DiceRoll | null>(null)
  const [history, setHistory] = useState<DiceRoll[]>([])

  const doRoll = (type: string, rollFn: () => number) => {
    const result = rollFn()
    const roll: DiceRoll = {
      type,
      result,
      timestamp: new Date().toLocaleTimeString()
    }
    setLastRoll(roll)
    setHistory(prev => [roll, ...prev.slice(0, 9)])
  }

  const doD36Roll = () => {
    const d3 = rollD3()
    const d6 = rollD6()
    const result = d3 * 10 + d6
    const roll: DiceRoll = {
      type: 'D36',
      result,
      breakdown: `${d3}${d6} (D3:${d3}, D6:${d6})`,
      timestamp: new Date().toLocaleTimeString()
    }
    setLastRoll(roll)
    setHistory(prev => [roll, ...prev.slice(0, 9)])
  }

  return (
    <div className="dice-roller">
      <h3>Dice Roller</h3>

      <div className="dice-buttons">
        <button
          className="dice-btn d3"
          onClick={() => doRoll('D3', rollD3)}
        >
          D3
        </button>
        <button
          className="dice-btn d6"
          onClick={() => doRoll('D6', rollD6)}
        >
          D6
        </button>
        <button
          className="dice-btn d36"
          onClick={doD36Roll}
        >
          D36
        </button>
        <button
          className="dice-btn d2d6"
          onClick={() => doRoll('2D6', roll2D6)}
        >
          2D6
        </button>
      </div>

      {lastRoll && (
        <div className="last-roll">
          <div className="roll-type">{lastRoll.type}</div>
          <div className="roll-result">{lastRoll.result}</div>
          {lastRoll.breakdown && (
            <div className="roll-breakdown">{lastRoll.breakdown}</div>
          )}
        </div>
      )}

      {history.length > 0 && (
        <div className="roll-history">
          <h4>History</h4>
          <div className="history-list">
            {history.map((roll, idx) => (
              <div key={idx} className="history-item">
                <span className="history-type">{roll.type}</span>
                <span className="history-result">{roll.result}</span>
                <span className="history-time">{roll.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
