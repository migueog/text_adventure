/**
 * WHY: Issue #56 - Tests for PerformanceHistory component
 * TDD: Write tests first for performance history viewer
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PerformanceHistory from './PerformanceHistory'
import type { SoloPerformanceHistory } from '@/types/soloPerformance'

describe('PerformanceHistory', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    mockOnClose.mockClear()
    // WHY: Mock window.URL.createObjectURL for export tests
    global.URL.createObjectURL = vi.fn(() => 'mock-url')
    global.URL.revokeObjectURL = vi.fn()
  })

  describe('empty history', () => {
    const emptyHistory: SoloPerformanceHistory = {
      campaigns: [],
      personalBests: {
        highestCP: null,
        mostSPSpent: null,
        mostHexesExplored: null,
        mostGamesPlayed: null,
        mostGamesWon: null,
        mostOperatives: null,
        shortestVictory: null,
        longestVictory: null
      },
      lastUpdated: '2025-01-15T10:00:00Z'
    }

    it('should display empty state message', () => {
      render(<PerformanceHistory history={emptyHistory} onClose={mockOnClose} />)

      expect(screen.getByText(/no campaigns/i)).toBeInTheDocument()
    })

    it('should disable export button when empty', () => {
      render(<PerformanceHistory history={emptyHistory} onClose={mockOnClose} />)

      const exportBtn = screen.getByRole('button', { name: /export/i })
      expect(exportBtn).toBeDisabled()
    })

    it('should disable clear button when empty', () => {
      render(<PerformanceHistory history={emptyHistory} onClose={mockOnClose} />)

      const clearBtn = screen.getByRole('button', { name: /clear/i })
      expect(clearBtn).toBeDisabled()
    })
  })

  describe('with campaign history', () => {
    const mockHistory: SoloPerformanceHistory = {
      campaigns: [
        {
          campaignId: 'campaign-2',
          date: '2025-01-16T10:00:00Z',
          success: true,
          finalCP: 150,
          finalThreat: 10,
          rounds: 10,
          categories: {
            pioneer: { name: 'Pioneer', value: 50, description: 'SP' },
            explorer: { name: 'Explorer', value: 15, description: 'Hexes' },
            trooper: { name: 'Trooper', value: 10, description: 'Games' },
            warrior: { name: 'Warrior', value: 7, description: 'Wins' },
            headhunter: { name: 'Headhunter', value: 20, description: 'Ops' }
          },
          stats: { winRate: 0.7, avgCPPerRound: 15, spSpentPerRound: 5, hexesPerRound: 1.5 }
        },
        {
          campaignId: 'campaign-1',
          date: '2025-01-15T10:00:00Z',
          success: false,
          finalCP: 100,
          finalThreat: 10,
          rounds: 12,
          categories: {
            pioneer: { name: 'Pioneer', value: 30, description: 'SP' },
            explorer: { name: 'Explorer', value: 10, description: 'Hexes' },
            trooper: { name: 'Trooper', value: 8, description: 'Games' },
            warrior: { name: 'Warrior', value: 5, description: 'Wins' },
            headhunter: { name: 'Headhunter', value: 12, description: 'Ops' }
          },
          stats: { winRate: 0.625, avgCPPerRound: 8.33, spSpentPerRound: 2.5, hexesPerRound: 0.83 }
        }
      ],
      personalBests: {
        highestCP: { value: 150, campaignId: 'campaign-2', date: '2025-01-16T10:00:00Z' },
        mostSPSpent: { value: 50, campaignId: 'campaign-2', date: '2025-01-16T10:00:00Z' },
        mostHexesExplored: { value: 15, campaignId: 'campaign-2', date: '2025-01-16T10:00:00Z' },
        mostGamesPlayed: { value: 10, campaignId: 'campaign-2', date: '2025-01-16T10:00:00Z' },
        mostGamesWon: { value: 7, campaignId: 'campaign-2', date: '2025-01-16T10:00:00Z' },
        mostOperatives: { value: 20, campaignId: 'campaign-2', date: '2025-01-16T10:00:00Z' },
        shortestVictory: { value: 10, campaignId: 'campaign-2', date: '2025-01-16T10:00:00Z' },
        longestVictory: { value: 10, campaignId: 'campaign-2', date: '2025-01-16T10:00:00Z' }
      },
      lastUpdated: '2025-01-16T10:00:00Z'
    }

    it('should display modal header with close button', () => {
      render(<PerformanceHistory history={mockHistory} onClose={mockOnClose} />)

      expect(screen.getByRole('heading', { name: /solo performance history/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
    })

    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup()
      render(<PerformanceHistory history={mockHistory} onClose={mockOnClose} />)

      await user.click(screen.getByRole('button', { name: /close/i }))

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should display personal bests panel', () => {
      render(<PerformanceHistory history={mockHistory} onClose={mockOnClose} />)

      expect(screen.getByText(/personal bests/i)).toBeInTheDocument()
      expect(screen.getByText(/highest cp/i)).toBeInTheDocument()
      expect(screen.getByText(/most sp spent/i)).toBeInTheDocument()
    })

    it('should display all campaigns in chronological order', () => {
      render(<PerformanceHistory history={mockHistory} onClose={mockOnClose} />)

      const campaigns = screen.getAllByTestId('campaign-card')
      expect(campaigns).toHaveLength(2)

      // WHY: Newest first
      expect(campaigns[0]).toHaveTextContent('campaign-2')
      expect(campaigns[1]).toHaveTextContent('campaign-1')
    })

    it('should display success status for successful campaigns', () => {
      render(<PerformanceHistory history={mockHistory} onClose={mockOnClose} />)

      const successBadges = screen.getAllByText(/victory/i)
      expect(successBadges.length).toBeGreaterThan(0)
    })

    it('should display failure status for failed campaigns', () => {
      render(<PerformanceHistory history={mockHistory} onClose={mockOnClose} />)

      expect(screen.getByText(/defeat/i)).toBeInTheDocument()
    })

    it('should highlight campaigns holding records with star emoji', () => {
      render(<PerformanceHistory history={mockHistory} onClose={mockOnClose} />)

      // WHY: campaign-2 holds all records
      const campaigns = screen.getAllByTestId('campaign-card')
      expect(campaigns[0]).toHaveTextContent('⭐')
    })

    it('should not highlight campaigns not holding any records', () => {
      render(<PerformanceHistory history={mockHistory} onClose={mockOnClose} />)

      const campaigns = screen.getAllByTestId('campaign-card')
      // WHY: campaign-1 holds no records
      expect(campaigns[1]).not.toHaveTextContent('⭐')
    })

    it('should enable export button when history exists', () => {
      render(<PerformanceHistory history={mockHistory} onClose={mockOnClose} />)

      const exportBtn = screen.getByRole('button', { name: /export/i })
      expect(exportBtn).not.toBeDisabled()
    })

    it('should enable clear button when history exists', () => {
      render(<PerformanceHistory history={mockHistory} onClose={mockOnClose} />)

      const clearBtn = screen.getByRole('button', { name: /clear/i })
      expect(clearBtn).not.toBeDisabled()
    })
  })

  describe('campaign display', () => {
    it('should display campaign cards', () => {
      const history: SoloPerformanceHistory = {
        campaigns: [
          {
            campaignId: 'test',
            date: '2025-01-15T14:30:00Z',
            success: true,
            finalCP: 100,
            finalThreat: 10,
            rounds: 10,
            categories: {
              pioneer: { name: 'Pioneer', value: 30, description: '' },
              explorer: { name: 'Explorer', value: 10, description: '' },
              trooper: { name: 'Trooper', value: 8, description: '' },
              warrior: { name: 'Warrior', value: 5, description: '' },
              headhunter: { name: 'Headhunter', value: 12, description: '' }
            },
            stats: { winRate: 0.625, avgCPPerRound: 10, spSpentPerRound: 3, hexesPerRound: 1 }
          }
        ],
        personalBests: {
          highestCP: { value: 100, campaignId: 'test', date: '2025-01-15T14:30:00Z' },
          mostSPSpent: null,
          mostHexesExplored: null,
          mostGamesPlayed: null,
          mostGamesWon: null,
          mostOperatives: null,
          shortestVictory: { value: 10, campaignId: 'test', date: '2025-01-15T14:30:00Z' },
          longestVictory: null
        },
        lastUpdated: '2025-01-15T14:30:00Z'
      }

      render(<PerformanceHistory history={history} onClose={vi.fn()} />)

      // WHY: Should display campaign card with test id
      expect(screen.getByTestId('campaign-card')).toBeInTheDocument()
      expect(screen.getByText('test')).toBeInTheDocument()
    })
  })
})
