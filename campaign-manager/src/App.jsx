import React from 'react';
import { useCampaign } from './hooks/useCampaign';
import GameSetup from './components/GameSetup';
import HexMap from './components/HexMap';
import PlayerPanel from './components/PlayerPanel';
import PhaseTracker from './components/PhaseTracker';
import DiceRoller from './components/DiceRoller';
import EventLog from './components/EventLog';
import HexDetails from './components/HexDetails';
import VictoryScreen from './components/VictoryScreen';
import './App.css';

function App() {
  const campaign = useCampaign();

  const handleStartGame = (playerCount, soloMode, targetThreat, playerNames) => {
    campaign.setTargetThreatLevel(targetThreat);
    campaign.startGame(playerCount, soloMode);

    // Update player names
    playerNames.forEach((name, idx) => {
      campaign.updatePlayer(idx, { name });
    });
  };

  const handleHexClick = (hex) => {
    campaign.setSelectedHex(hex.id === campaign.selectedHex ? null : hex.id);
  };

  const handleRestart = () => {
    window.location.reload();
  };

  // Show setup screen if game hasn't started
  if (!campaign.gameStarted) {
    return <GameSetup onStartGame={handleStartGame} />;
  }

  // Show victory screen if game has ended
  if (campaign.gameEnded) {
    return (
      <VictoryScreen
        players={campaign.players}
        onRestart={handleRestart}
      />
    );
  }

  const currentPlayer = campaign.players[campaign.currentPlayerIndex];

  return (
    <div className="app">
      <header className="app-header">
        <h1>Ctesiphus Expedition</h1>
        <div className="header-info">
          <span>Round {campaign.currentRound}</span>
          <span className="divider">|</span>
          <span>Threat: {campaign.threatLevel}/{campaign.targetThreatLevel}</span>
          <span className="divider">|</span>
          <span style={{ color: currentPlayer?.color }}>
            {currentPlayer?.name}'s Turn
          </span>
        </div>
      </header>

      <main className="app-main">
        <aside className="sidebar left">
          <PlayerPanel
            players={campaign.players}
            currentPlayerIndex={campaign.currentPlayerIndex}
            onUpdatePlayer={campaign.updatePlayer}
          />
          <DiceRoller />
        </aside>

        <section className="center-content">
          <HexMap
            hexes={campaign.hexes}
            players={campaign.players}
            mapConfig={campaign.mapConfig}
            selectedHex={campaign.selectedHex}
            onHexClick={handleHexClick}
            currentPlayerIndex={campaign.currentPlayerIndex}
          />
        </section>

        <aside className="sidebar right">
          <PhaseTracker
            currentPhase={campaign.currentPhase}
            currentRound={campaign.currentRound}
            currentPlayer={currentPlayer}
            players={campaign.players}
            hexes={campaign.hexes}
            mapConfig={campaign.mapConfig}
            threatLevel={campaign.threatLevel}
            targetThreatLevel={campaign.targetThreatLevel}
            onNextPhase={campaign.nextPhase}
            onMove={campaign.movePlayer}
            onAction={campaign.performAction}
            onBattle={campaign.recordBattle}
            calculateEncampCost={campaign.calculateEncampCost}
            selectedHex={campaign.selectedHex}
          />
          <HexDetails
            hex={campaign.hexes[campaign.selectedHex]}
            players={campaign.players}
          />
        </aside>
      </main>

      <footer className="app-footer">
        <EventLog events={campaign.eventLog} />
      </footer>
    </div>
  );
}

export default App;
