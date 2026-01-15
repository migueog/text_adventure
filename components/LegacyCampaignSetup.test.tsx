/**
 * WHY: Issue #57 - Tests for LegacyCampaignSetup component
 * TDD: Write tests first before implementation
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import LegacyCampaignSetup from './LegacyCampaignSetup'
import type { CampaignSnapshot } from '@/types/legacyCampaign'

describe('LegacyCampaignSetup', () => {
  const mockSnapshot: CampaignSnapshot = {
    campaignId: 'campaign-123',
    campaignName: 'First Expedition',
    playerName: 'Player 1',
    killTeamName: 'Blood Ravens',
    faction: 'Space Marines',
    backstory: 'Elite veterans',
    mapSize: { rows: 5, cols: 5 },
    exploredHexes: [
      {
        hexId: '0,2',
        row: 0,
        col: 2,
        type: 'surface',
        locationNumber: 25,
        conditionNumber: 21,
        locationId: 'SL25',
        conditionId: 'SC21',
        searched: true,
        camped: false
      },
      {
        hexId: '1,1',
        row: 1,
        col: 1,
        type: 'surface',
        locationNumber: 16,
        conditionNumber: 16,
        locationId: 'SL11-16',
        conditionId: 'SC11-16',
        searched: true,
        camped: true
      }
    ],
    finalCP: 11,
    finalThreat: 10,
    rounds: 12,
    success: true,
    completedDate: '2025-01-04T10:00:00Z',
    targetThreatLevel: 10
  }

  const mockOnConfirm = vi.fn()
  const mockOnCancel = vi.fn()

  describe('Campaign Summary Display', () => {
    it('should display campaign name and summary', () => {
      render(
        <LegacyCampaignSetup
          snapshot={mockSnapshot}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByText(/First Expedition/i)).toBeInTheDocument()
      expect(screen.getByText('Blood Ravens')).toBeInTheDocument()
    })

    it('should display campaign statistics', () => {
      render(
        <LegacyCampaignSetup
          snapshot={mockSnapshot}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByText(/11 CP/i)).toBeInTheDocument()
      expect(screen.getByText(/10.*10/i)).toBeInTheDocument() // Threat 10/10
      expect(screen.getByText(/2.*explored/i)).toBeInTheDocument()
    })

    it('should display old base location indicator', () => {
      render(
        <LegacyCampaignSetup
          snapshot={mockSnapshot}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      )

      // WHY: Old base at 0,2 should be indicated
      expect(screen.getByText(/Will become Abandoned Camp/i)).toBeInTheDocument()
    })
  })

  describe('Hex Selection', () => {
    it('should initially have no hex selected', () => {
      render(
        <LegacyCampaignSetup
          snapshot={mockSnapshot}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      )

      const confirmButton = screen.getByRole('button', { name: /Confirm New Base/i })
      expect(confirmButton).toBeDisabled()
    })

    it('should enable confirm button when hex is selected', () => {
      render(
        <LegacyCampaignSetup
          snapshot={mockSnapshot}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      )

      // WHY: Find and click a surface hex button (row 0, col 0)
      const hexButton = screen.getByTestId('hex-0,0')
      fireEvent.click(hexButton)

      const confirmButton = screen.getByRole('button', { name: /Confirm New Base/i })
      expect(confirmButton).toBeEnabled()
    })

    it('should display selected hex information', () => {
      render(
        <LegacyCampaignSetup
          snapshot={mockSnapshot}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      )

      const hexButton = screen.getByTestId('hex-0,0')
      fireEvent.click(hexButton)

      expect(screen.getByText(/Selected: Row 0, Col 0/i)).toBeInTheDocument()
    })

    it('should prevent selecting old base hex', () => {
      render(
        <LegacyCampaignSetup
          snapshot={mockSnapshot}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      )

      // WHY: Try to select old base at 0,2
      const oldBaseHex = screen.getByTestId('hex-0,2')
      fireEvent.click(oldBaseHex)

      const confirmButton = screen.getByRole('button', { name: /Confirm New Base/i })
      expect(confirmButton).toBeDisabled()
      expect(screen.getByText(/Cannot select the old base.*Abandoned Camp/i)).toBeInTheDocument()
    })

    it('should allow changing selection', () => {
      render(
        <LegacyCampaignSetup
          snapshot={mockSnapshot}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      )

      // Select first hex
      const hex1 = screen.getByTestId('hex-0,0')
      fireEvent.click(hex1)
      expect(screen.getByText(/Row 0, Col 0/i)).toBeInTheDocument()

      // Select different hex
      const hex2 = screen.getByTestId('hex-0,1')
      fireEvent.click(hex2)
      expect(screen.getByText(/Row 0, Col 1/i)).toBeInTheDocument()
    })
  })

  describe('Confirmation and Cancellation', () => {
    it('should call onConfirm with selected hex when confirmed', () => {
      render(
        <LegacyCampaignSetup
          snapshot={mockSnapshot}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      )

      const hexButton = screen.getByTestId('hex-0,0')
      fireEvent.click(hexButton)

      const confirmButton = screen.getByRole('button', { name: /Confirm New Base/i })
      fireEvent.click(confirmButton)

      expect(mockOnConfirm).toHaveBeenCalledWith(
        expect.objectContaining({
          row: 0,
          col: 0
        })
      )
    })

    it('should call onCancel when cancel button clicked', () => {
      render(
        <LegacyCampaignSetup
          snapshot={mockSnapshot}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      )

      const cancelButton = screen.getByRole('button', { name: /Cancel/i })
      fireEvent.click(cancelButton)

      expect(mockOnCancel).toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    it('should handle snapshot with no explored hexes', () => {
      const emptySnapshot: CampaignSnapshot = {
        ...mockSnapshot,
        exploredHexes: []
      }

      render(
        <LegacyCampaignSetup
          snapshot={emptySnapshot}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByText(/0.*explored/i)).toBeInTheDocument()
    })

    it('should handle snapshot without optional fields', () => {
      const minimalSnapshot: CampaignSnapshot = {
        ...mockSnapshot,
        faction: undefined,
        backstory: undefined
      }

      render(
        <LegacyCampaignSetup
          snapshot={minimalSnapshot}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByText('Blood Ravens')).toBeInTheDocument()
    })
  })

  describe('Hex Map Display', () => {
    it('should render hex grid with correct dimensions', () => {
      render(
        <LegacyCampaignSetup
          snapshot={mockSnapshot}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      )

      // WHY: 5x5 grid = 25 hexes
      const hexButtons = screen.getAllByTestId(/^hex-/)
      expect(hexButtons).toHaveLength(25)
    })

    it('should highlight explored hexes differently', () => {
      render(
        <LegacyCampaignSetup
          snapshot={mockSnapshot}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      )

      const exploredHex = screen.getByTestId('hex-0,2')
      expect(exploredHex).toHaveClass('explored')
    })

    it('should mark old base hex specially', () => {
      render(
        <LegacyCampaignSetup
          snapshot={mockSnapshot}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      )

      const oldBaseHex = screen.getByTestId('hex-0,2')
      expect(oldBaseHex).toHaveClass('old-base')
    })
  })
})
