import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Animated,
  ActivityIndicator,
  Platform,
  StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  WifiOff,
  RefreshCw,
  Trophy,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
  Ticket,
  X,
  Volume2,
  ChevronRight,
  TrendingUp,
} from "lucide-react-native";
import { COLORS } from "../constants/colors";
import { useDeviceAdaptive } from "../hooks/useDeviceAdaptive";
import { useNetwork } from "../context/NetworkContext";
import { triggerLightHaptic, triggerMediumHaptic, triggerHeavyHaptic } from "../utils/haptics";

const HIGH_SCORE_KEY = "@lucky_runner_high_score";
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface Obstacle {
  id: number;
  x: number;
  width: number;
  height: number;
  type: "barrier" | "spikes" | "rock";
}

interface Coin {
  id: number;
  x: number;
  y: number;
  collected: boolean;
}

export default function OfflineGameModal() {
  const { showGameModal, setShowGameModal, checkConnection, isChecking } = useNetwork();
  const { safeTopInset, safeBottomInset, isAndroid } = useDeviceAdaptive(false);

  // Dynamic ground level based on safe bottom insets
  const GROUND_Y = SCREEN_HEIGHT - (safeBottomInset + 120);
  const GRAVITY = 0.68;
  const JUMP_VELOCITY = -13.5;
  const PLAYER_SIZE = 40;

  // Game States
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [coinsCollected, setCoinsCollected] = useState(0);
  const [highScore, setHighScore] = useState(0);

  // Player physics
  const playerYRef = useRef(GROUND_Y - PLAYER_SIZE);
  const playerVyRef = useRef(0);
  const isJumpingRef = useRef(false);
  const [playerY, setPlayerY] = useState(GROUND_Y - PLAYER_SIZE);

  // Game objects
  const obstaclesRef = useRef<Obstacle[]>([]);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const coinsRef = useRef<Coin[]>([]);
  const [coins, setCoins] = useState<Coin[]>([]);

  const frameIdRef = useRef<number | null>(null);
  const gameSpeedRef = useRef(4.2);
  const nextObstacleDistanceRef = useRef(150);
  const nextCoinDistanceRef = useRef(100);

  // Load High Score
  useEffect(() => {
    AsyncStorage.getItem(HIGH_SCORE_KEY)
      .then((val) => {
        if (val) setHighScore(parseInt(val, 10) || 0);
      })
      .catch(() => {});
  }, []);

  // Jump Action
  const jump = useCallback(() => {
    if (!isPlaying) {
      startGame();
      return;
    }
    if (!isJumpingRef.current) {
      playerVyRef.current = JUMP_VELOCITY;
      isJumpingRef.current = true;
      triggerLightHaptic();
    }
  }, [isPlaying, GROUND_Y]);

  // Start / Restart Game
  const startGame = () => {
    playerYRef.current = GROUND_Y - PLAYER_SIZE;
    playerVyRef.current = 0;
    isJumpingRef.current = false;
    obstaclesRef.current = [];
    coinsRef.current = [];
    gameSpeedRef.current = 4.2;
    nextObstacleDistanceRef.current = 150;
    nextCoinDistanceRef.current = 100;

    setPlayerY(GROUND_Y - PLAYER_SIZE);
    setObstacles([]);
    setCoins([]);
    setScore(0);
    setCoinsCollected(0);
    setIsGameOver(false);
    setIsPlaying(true);
    triggerMediumHaptic();
  };

  // Main 60fps Game Loop
  useEffect(() => {
    if (!isPlaying || isGameOver) {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
        frameIdRef.current = null;
      }
      return;
    }

    let lastTime = Date.now();

    const loop = () => {
      // 1. Update Player Physics
      playerVyRef.current += GRAVITY;
      playerYRef.current += playerVyRef.current;

      if (playerYRef.current >= GROUND_Y - PLAYER_SIZE) {
        playerYRef.current = GROUND_Y - PLAYER_SIZE;
        playerVyRef.current = 0;
        isJumpingRef.current = false;
      }

      setPlayerY(playerYRef.current);

      // 2. Move Obstacles
      const speed = gameSpeedRef.current;
      const currentObs: Obstacle[] = [];

      for (let i = 0; i < obstaclesRef.current.length; i++) {
        const obs = obstaclesRef.current[i];
        const newX = obs.x - speed;
        if (newX + obs.width > 0) {
          currentObs.push({ ...obs, x: newX });
        }
      }

      // Spawn new obstacles
      nextObstacleDistanceRef.current -= speed;
      if (nextObstacleDistanceRef.current <= 0) {
        const rand = Math.random();
        const obsWidth = rand > 0.6 ? 28 : 22;
        const obsHeight = rand > 0.5 ? 42 : 30;
        currentObs.push({
          id: Date.now() + Math.random(),
          x: SCREEN_WIDTH + 20,
          width: obsWidth,
          height: obsHeight,
          type: rand > 0.6 ? "barrier" : rand > 0.3 ? "spikes" : "rock",
        });
        nextObstacleDistanceRef.current = 160 + Math.random() * 140;
      }
      obstaclesRef.current = currentObs;
      setObstacles([...currentObs]);

      // 3. Move & Collect Coins
      const currentCoins: Coin[] = [];
      nextCoinDistanceRef.current -= speed;

      for (let i = 0; i < coinsRef.current.length; i++) {
        const coin = coinsRef.current[i];
        const newX = coin.x - speed;
        if (newX > -30 && !coin.collected) {
          // Check collision with player
          const playerLeft = 36;
          const playerRight = 36 + PLAYER_SIZE;
          const playerTop = playerYRef.current;
          const playerBottom = playerYRef.current + PLAYER_SIZE;

          const coinLeft = newX;
          const coinRight = newX + 24;
          const coinTop = coin.y;
          const coinBottom = coin.y + 24;

          if (
            playerRight >= coinLeft &&
            playerLeft <= coinRight &&
            playerBottom >= coinTop &&
            playerTop <= coinBottom
          ) {
            // Coin collected!
            setCoinsCollected((c) => c + 1);
            setScore((s) => s + 50);
            triggerLightHaptic();
          } else {
            currentCoins.push({ ...coin, x: newX });
          }
        }
      }

      if (nextCoinDistanceRef.current <= 0) {
        currentCoins.push({
          id: Date.now() + Math.random(),
          x: SCREEN_WIDTH + 20,
          y: GROUND_Y - 70 - Math.random() * 50,
          collected: false,
        });
        nextCoinDistanceRef.current = 180 + Math.random() * 160;
      }
      coinsRef.current = currentCoins;
      setCoins([...currentCoins]);

      // 4. Check Collision with Obstacles
      const playerBox = {
        left: 40,
        right: 40 + PLAYER_SIZE - 6,
        top: playerYRef.current + 4,
        bottom: playerYRef.current + PLAYER_SIZE,
      };

      let collided = false;
      for (let i = 0; i < currentObs.length; i++) {
        const o = currentObs[i];
        const obsBox = {
          left: o.x + 3,
          right: o.x + o.width - 3,
          top: GROUND_Y - o.height + 4,
          bottom: GROUND_Y,
        };

        if (
          playerBox.right > obsBox.left &&
          playerBox.left < obsBox.right &&
          playerBox.bottom > obsBox.top &&
          playerBox.top < obsBox.bottom
        ) {
          collided = true;
          break;
        }
      }

      if (collided) {
        setIsGameOver(true);
        setIsPlaying(false);
        triggerHeavyHaptic();

        setScore((finalScore) => {
          setHighScore((prevHigh) => {
            if (finalScore > prevHigh) {
              AsyncStorage.setItem(HIGH_SCORE_KEY, finalScore.toString()).catch(() => {});
              return finalScore;
            }
            return prevHigh;
          });
          return finalScore;
        });
        return;
      }

      // 5. Increment Score and Speed
      setScore((s) => s + 1);
      gameSpeedRef.current = Math.min(8.5, 4.2 + (Date.now() - lastTime) / 12000);

      frameIdRef.current = requestAnimationFrame(loop);
    };

    frameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
    };
  }, [isPlaying, isGameOver, GROUND_Y]);

  const handleRetryConnection = async () => {
    triggerLightHaptic();
    const connected = await checkConnection();
    if (connected) {
      triggerMediumHaptic();
      setShowGameModal(false);
    }
  };

  if (!showGameModal) return null;

  return (
    <Modal
      visible={showGameModal}
      animationType="fade"
      transparent={false}
      statusBarTranslucent={true}
      onRequestClose={() => {
        // Back button allows exiting to view cached data
        setShowGameModal(false);
      }}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Full-Screen Interactive Game Arena */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={jump}
        style={styles.fullScreenCanvas}
      >
        {/* Sky Background & Celestial Objects */}
        <View style={styles.sunMoon} />

        {/* Floating Clouds */}
        <View style={[styles.cloud, { top: safeTopInset + 80, left: 30, width: 70, height: 22 }]} />
        <View style={[styles.cloud, { top: safeTopInset + 120, left: SCREEN_WIDTH - 110, width: 85, height: 24, opacity: 0.7 }]} />
        <View style={[styles.cloud, { top: safeTopInset + 160, left: 140, width: 60, height: 18, opacity: 0.5 }]} />

        {/* Distant Mountain Silhouettes */}
        <View style={[styles.mountainBg, { top: GROUND_Y - 90 }]} />

        {/* Ground Terrain */}
        <View style={[styles.groundSurface, { top: GROUND_Y }]} />
        <View style={[styles.groundUnderground, { top: GROUND_Y + 12, height: SCREEN_HEIGHT - GROUND_Y }]} />

        {/* Floating Collectible Coins */}
        {coins.map((coin) => (
          <View
            key={coin.id}
            style={[
              styles.coinItem,
              { left: coin.x, top: coin.y },
            ]}
          >
            <Text style={{ fontSize: 22 }}>🪙</Text>
          </View>
        ))}

        {/* Oncoming Obstacles */}
        {obstacles.map((obs) => (
          <View
            key={obs.id}
            style={[
              styles.obstacleItem,
              {
                left: obs.x,
                top: GROUND_Y - obs.height,
                width: obs.width,
                height: obs.height,
                backgroundColor:
                  obs.type === "barrier"
                    ? "#EF4444"
                    : obs.type === "spikes"
                    ? "#DC2626"
                    : "#475569",
              },
            ]}
          >
            <View style={styles.obstacleHighlight} />
          </View>
        ))}

        {/* Lucky Ticket Runner Mascot */}
        <View
          style={[
            styles.playerContainer,
            { top: playerY, left: 36 },
          ]}
        >
          <View style={styles.playerTicket}>
            <Ticket size={24} color="#FFFFFF" strokeWidth={2.4} />
          </View>
          {isJumpingRef.current && (
            <View style={styles.playerShadow} />
          )}
        </View>

        {/* Top Floating Glassmorphic HUD */}
        <View style={[styles.topHudContainer, { paddingTop: safeTopInset + 10 }]}>
          {/* Row 1: Connection status, Retry button & Close button */}
          <View style={styles.hudTopRow}>
            <View style={styles.offlinePill}>
              <WifiOff size={14} color="#EF4444" />
              <Text style={styles.offlinePillText}>Offline Mode</Text>
            </View>

            <View style={styles.hudActions}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.hudBtn, isChecking && styles.hudBtnDisabled]}
                onPress={handleRetryConnection}
                disabled={isChecking}
              >
                {isChecking ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <RefreshCw size={13} color="#FFFFFF" />
                    <Text style={styles.hudBtnText}>Check Internet</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.closeHudBtn}
                onPress={() => setShowGameModal(false)}
              >
                <X size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Row 2: Live Stats Bar */}
          <View style={styles.statsBar}>
            <View style={styles.statCard}>
              <Trophy size={15} color="#FBBF24" />
              <Text style={styles.statLabel}>BEST:</Text>
              <Text style={styles.statNumber}>{highScore}</Text>
            </View>

            <View style={styles.statCard}>
              <Sparkles size={15} color="#FCD34D" />
              <Text style={styles.statLabel}>COINS:</Text>
              <Text style={styles.statNumber}>{coinsCollected}</Text>
            </View>

            <View style={styles.statCard}>
              <Zap size={15} color="#60A5FA" />
              <Text style={styles.statLabel}>SCORE:</Text>
              <Text style={styles.statNumber}>{score}</Text>
            </View>
          </View>
        </View>

        {/* Tap Prompt at Bottom of Screen */}
        <View style={[styles.bottomControlsBar, { bottom: safeBottomInset + 16 }]}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={jump}
            style={styles.bigJumpBtn}
          >
            <Text style={styles.bigJumpBtnText}>👆 TAP ANYWHERE TO JUMP</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => setShowGameModal(false)}
            style={styles.browseCacheLink}
          >
            <Text style={styles.browseCacheLinkText}>Continue to Cached App</Text>
            <ChevronRight size={14} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Start Game & Game Over Overlays */}
        {!isPlaying && (
          <View style={styles.modalOverlay}>
            <View style={styles.dialogCard}>
              {isGameOver ? (
                <>
                  <View style={styles.dialogIconBadge}>
                    <Text style={{ fontSize: 32 }}>💥</Text>
                  </View>
                  <Text style={styles.dialogTitle}>Game Over!</Text>
                  <View style={styles.finalScoreRow}>
                    <View style={styles.finalScoreCol}>
                      <Text style={styles.finalScoreLabel}>Score</Text>
                      <Text style={styles.finalScoreVal}>{score}</Text>
                    </View>
                    <View style={styles.finalScoreDivider} />
                    <View style={styles.finalScoreCol}>
                      <Text style={styles.finalScoreLabel}>Coins</Text>
                      <Text style={styles.finalScoreVal}>🪙 {coinsCollected}</Text>
                    </View>
                    <View style={styles.finalScoreDivider} />
                    <View style={styles.finalScoreCol}>
                      <Text style={styles.finalScoreLabel}>High Score</Text>
                      <Text style={styles.finalScoreVal}>{highScore}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.playButton}
                    onPress={startGame}
                  >
                    <RotateCcw size={18} color="#FFFFFF" />
                    <Text style={styles.playButtonText}>Play Again</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={styles.dialogIconBadge}>
                    <Ticket size={34} color={COLORS.primary} strokeWidth={2.4} />
                  </View>
                  <Text style={styles.dialogTitle}>🎰 Lucky Ticket Runner</Text>
                  <Text style={styles.dialogSubtitle}>
                    You're offline! Jump over obstacles and collect lucky lottery coins while we search for internet.
                  </Text>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.playButton}
                    onPress={startGame}
                  >
                    <Play size={18} color="#FFFFFF" />
                    <Text style={styles.playButtonText}>Tap to Start Run</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        )}
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fullScreenCanvas: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: "#0F172A",
    position: "relative",
    overflow: "hidden",
  },
  sunMoon: {
    position: "absolute",
    top: 60,
    right: 36,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FDE047",
    shadowColor: "#FDE047",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  cloud: {
    position: "absolute",
    backgroundColor: "#1E293B",
    borderRadius: 14,
  },
  mountainBg: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 90,
    backgroundColor: "#1E293B",
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
    opacity: 0.5,
  },
  groundSurface: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 12,
    backgroundColor: "#10B981",
  },
  groundUnderground: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: "#064E3B",
  },
  coinItem: {
    position: "absolute",
    zIndex: 10,
  },
  obstacleItem: {
    position: "absolute",
    borderRadius: 6,
    zIndex: 8,
  },
  obstacleHighlight: {
    width: "100%",
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  playerContainer: {
    position: "absolute",
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 15,
  },
  playerTicket: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  playerShadow: {
    position: "absolute",
    bottom: -8,
    width: 20,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  topHudContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 30,
  },
  hudTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  offlinePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.4)",
  },
  offlinePillText: {
    color: "#FCA5A5",
    fontSize: 12,
    fontWeight: "700",
  },
  hudActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  hudBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 6,
  },
  hudBtnDisabled: {
    opacity: 0.7,
  },
  hudBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  closeHudBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  statsBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  statCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statLabel: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "800",
  },
  statNumber: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
  bottomControlsBar: {
    position: "absolute",
    left: 20,
    right: 20,
    alignItems: "center",
    zIndex: 25,
  },
  bigJumpBtn: {
    width: "100%",
    backgroundColor: "rgba(37, 99, 235, 0.9)",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#60A5FA",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 8,
  },
  bigJumpBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  browseCacheLink: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    gap: 4,
  },
  browseCacheLinkText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "700",
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 40,
    padding: 24,
  },
  dialogCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#1E293B",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  dialogIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  dialogTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 8,
  },
  dialogSubtitle: {
    color: "#94A3B8",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
  },
  finalScoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    backgroundColor: "#0F172A",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  finalScoreCol: {
    alignItems: "center",
    flex: 1,
  },
  finalScoreDivider: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  finalScoreLabel: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "700",
  },
  finalScoreVal: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    marginTop: 2,
  },
  playButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    backgroundColor: "#10B981",
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  playButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
});
