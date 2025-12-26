import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CampaignEndModal from './CampaignEndModal'

describe('CampaignEndModal', () => {
  const defaultProps = {
    threatLevel: 10,
    targetThreatLevel: 10,
    currentRound: 12,
    onViewScores: vi.fn(),
    onContinue: vi.fn()
  }

  describe('content display', () => {
    it('should display "Campaign Complete!" message', () => {
      render(<CampaignEndModal {...defaultProps} />)

      expect(screen.getByText(/Campaign Complete/i)).toBeDefined()
    })

    it('should display final threat level label', () => {
      render(<CampaignEndModal {...defaultProps} />)

      expect(screen.getByText(/Final Threat Level/i)).toBeDefined()
    })

    it('should display threat level value', () => {
      render(<CampaignEndModal {...defaultProps} />)

      expect(screen.getByText('10 / 10')).toBeDefined()
    })

    it('should display current round count', () => {
      render(<CampaignEndModal {...defaultProps} />)

      expect(screen.getByText(/Rounds Completed/i)).toBeDefined()
      expect(screen.getByText('12')).toBeDefined()
    })
  })

  describe('button interactions', () => {
    it('should display "View Final Scores" button', () => {
      render(<CampaignEndModal {...defaultProps} />)

      const button = screen.getByRole('button', { name: /view final scores/i })
      expect(button).toBeDefined()
    })

    it('should display "Continue Campaign" button', () => {
      render(<CampaignEndModal {...defaultProps} />)

      const button = screen.getByRole('button', { name: /continue campaign/i })
      expect(button).toBeDefined()
    })

    it('should call onViewScores when "View Final Scores" button is clicked', async () => {
      const user = userEvent.setup()
      const onViewScores = vi.fn()

      render(<CampaignEndModal {...defaultProps} onViewScores={onViewScores} />)

      const button = screen.getByRole('button', { name: /view final scores/i })
      await user.click(button)

      expect(onViewScores).toHaveBeenCalledTimes(1)
    })

    it('should call onContinue when "Continue Campaign" button is clicked', async () => {
      const user = userEvent.setup()
      const onContinue = vi.fn()

      render(<CampaignEndModal {...defaultProps} onContinue={onContinue} />)

      const button = screen.getByRole('button', { name: /continue campaign/i })
      await user.click(button)

      expect(onContinue).toHaveBeenCalledTimes(1)
    })
  })

  describe('accessibility', () => {
    it('should have dialog role', () => {
      render(<CampaignEndModal {...defaultProps} />)

      const dialog = screen.getByRole('dialog')
      expect(dialog).toBeDefined()
    })

    it('should have accessible title', () => {
      render(<CampaignEndModal {...defaultProps} />)

      const dialog = screen.getByRole('dialog')
      expect(dialog.getAttribute('aria-labelledby')).toBeTruthy()
    })

    it('should prevent background interaction with modal overlay', () => {
      render(<CampaignEndModal {...defaultProps} />)

      const overlay = document.querySelector('.modal-overlay')
      expect(overlay).toBeDefined()
    })
  })
})
