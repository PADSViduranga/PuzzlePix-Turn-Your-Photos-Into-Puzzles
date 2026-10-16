
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  Image,
  useWindowDimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const PURPLE = '#8B5CF6';
const CYAN = '#22D3EE';
const BG = '#10101B';
const CARD = '#1D1B30';

const DIFFICULTIES = [
  { size: 3, name: 'Easy' },
  { size: 4, name: 'Medium' },
  { size: 5, name: 'Hard' },
];

// Create a solved board: [1, 2, 3, ..., 0]
// Zero represents the empty space.
function createSolvedBoard(size) {
  return Array.from(
    { length: size * size },
    (_, index) => (index + 1) % (size * size)
  );
}

// Shuffle using valid moves so the puzzle is always solvable.
function shuffleBoard(size) {
  const board = createSolvedBoard(size);
  let empty = board.length - 1;
  let previousEmpty = -1;

  for (let i = 0; i < 150 * size; i++) {
    const row = Math.floor(empty / size);
    const col = empty % size;
    const neighbors = [];

    if (row > 0) neighbors.push(empty - size);
    if (row < size - 1) neighbors.push(empty + size);
    if (col > 0) neighbors.push(empty - 1);
    if (col < size - 1) neighbors.push(empty + 1);

    const choices = neighbors.filter(
      (index) => index !== previousEmpty
    );

    const next = choices[
      Math.floor(Math.random() * choices.length)
    ];

    board[empty] = board[next];
    board[next] = 0;

    previousEmpty = empty;
    empty = next;
  }

  // Avoid starting in the solved state.
  if (board.every(
    (value, index) => value === createSolvedBoard(size)[index]
  )) {
    const first = board.length - 1;
    const neighbor = first - 1;
    [board[first], board[neighbor]] = [
      board[neighbor],
      board[first],
    ];
  }

  return board;
}

function isSolved(board, size) {
  return board.every(
    (value, index) =>
      value === (index + 1) % (size * size)
  );
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(
    remaining
  ).padStart(2, '0')}`;
}

export default function App() {
  const { width } = useWindowDimensions();

  const [screen, setScreen] = useState('home');
  const [difficulty, setDifficulty] = useState(3);
  const [photo, setPhoto] = useState(null);
  const [board, setBoard] = useState([]);
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [won, setWon] = useState(false);

  const boardWidth = Math.min(width - 40, 440);
  const tileSize = boardWidth / difficulty;

  useEffect(() => {
    if (!playing || won) return undefined;

    const timer = setInterval(() => {
      setSeconds((current) => current + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [playing, won]);

  function startGame(selectedPhoto = photo) {
    if (!selectedPhoto) {
      Alert.alert(
        'Choose a photo',
        'Select a photo from your gallery to begin.'
      );
      return;
    }

    setPhoto(selectedPhoto);
    setBoard(shuffleBoard(difficulty));
    setMoves(0);
    setSeconds(0);
    setWon(false);
    setPlaying(true);
    setScreen('game');
  }

  async function choosePhoto() {
    try {
      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 1,
        });

      if (!result.canceled && result.assets?.length) {
        const selectedPhoto = result.assets[0];
        setPhoto(selectedPhoto);
        startGame(selectedPhoto);
      }
    } catch (error) {
      Alert.alert(
        'Photo selection failed',
        'Please try selecting your photo again.'
      );
    }
  }

  async function takePhoto() {
    try {
      const permission =
        await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Camera permission',
          'Allow camera access in your device settings to take a photo.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets?.length) {
        const selectedPhoto = result.assets[0];
        setPhoto(selectedPhoto);
        startGame(selectedPhoto);
      }
    } catch (error) {
      Alert.alert(
        'Camera unavailable',
        'Try using the gallery to select a photo.'
      );
    }
  }

  function moveTile(index) {
    if (won || !playing || board[index] === 0) return;

    const emptyIndex = board.indexOf(0);
    const row = Math.floor(index / difficulty);
    const col = index % difficulty;
    const emptyRow = Math.floor(emptyIndex / difficulty);
    const emptyCol = emptyIndex % difficulty;

    const adjacent =
      Math.abs(row - emptyRow) +
      Math.abs(col - emptyCol) === 1;

    if (!adjacent) return;

    const nextBoard = [...board];
    [nextBoard[index], nextBoard[emptyIndex]] = [
      nextBoard[emptyIndex],
      nextBoard[index],
    ];

    setBoard(nextBoard);
    setMoves((current) => current + 1);

    if (isSolved(nextBoard, difficulty)) {
      setWon(true);
      setPlaying(false);
    }
  }

  function restartGame() {
    if (!photo) return;

    setBoard(shuffleBoard(difficulty));
    setMoves(0);
    setSeconds(0);
    setWon(false);
    setPlaying(true);
  }

  function goHome() {
    setPlaying(false);
    setWon(false);
    setScreen('home');
  }

  function renderButton(label, onPress, color = PURPLE) {
    return (
      <TouchableOpacity
        style={[styles.button, { backgroundColor: color }]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>{label}</Text>
      </TouchableOpacity>
    );
  }

  function renderHome() {
    return (
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>🧩</Text>
          </View>

          <View>
            <Text style={styles.appName}>PuzzlePix</Text>
            <Text style={styles.tagline}>
              Your photos. Your puzzles.
            </Text>
          </View>
        </View>

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>READY TO PLAY?</Text>

          <Text style={styles.heroTitle}>
            Turn memories into challenges.
          </Text>

          <Text style={styles.description}>
            Choose your favorite photo, shuffle the tiles,
            and put the picture back together.
          </Text>

          {renderButton('▸  Choose a Photo', choosePhoto)}
          {renderButton(
            '📷  Take a Photo',
            takePhoto,
            '#26344A'
          )}
        </View>

        <Text style={styles.sectionTitle}>
          Choose difficulty
        </Text>

        <View style={styles.difficultyRow}>
          {DIFFICULTIES.map((item) => {
            const selected = difficulty === item.size;

            return (
              <TouchableOpacity
                key={item.size}
                style={[
                  styles.difficultyCard,
                  selected && styles.selectedCard,
                ]}
                onPress={() => setDifficulty(item.size)}
              >
                <Text style={styles.gridSize}>
                  {item.size}×{item.size}
                </Text>
                <Text
                  style={[
                    styles.difficultyName,
                    selected && styles.selectedText,
                  ]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {photo && (
          <View style={styles.previewCard}>
            <Image
              source={{ uri: photo.uri }}
              style={styles.previewImage}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.photoTitle}>
                Photo selected
              </Text>
              <Text style={styles.photoDescription}>
                Ready for a {difficulty}×{difficulty} puzzle.
              </Text>
            </View>
            {renderButton('Play', () => startGame())}
          </View>
        )}

        <Text style={styles.footer}>
          MADE FOR CURIOUS MINDS ✦ PUZZLEPIX
        </Text>
      </ScrollView>
    );
  }

  function renderGame() {
    return (
      <ScrollView
        contentContainerStyle={styles.gameContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.gameHeader}>
          <TouchableOpacity onPress={goHome}>
            <Text style={styles.backButton}>‹  Home</Text>
          </TouchableOpacity>

          <Text style={styles.appName}>PuzzlePix</Text>
        </View>

        <Text style={styles.gameTitle}>
          {won ? '🎉 Puzzle solved!' : 'Rebuild the picture'}
        </Text>

        <Text style={styles.gameSubtitle}>
          {won
            ? 'Amazing! You put every tile in its place.'
            : `Tap a tile beside the empty space to move it.`}
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>MOVES</Text>
            <Text style={styles.statValue}>{moves}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>TIME</Text>
            <Text style={styles.statValue}>
              {formatTime(seconds)}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>GRID</Text>
            <Text style={styles.statValue}>
              {difficulty}×{difficulty}
            </Text>
          </View>
        </View>

        {photo && (
          <View
            style={[
              styles.board,
              {
                width: boardWidth,
                height: boardWidth,
              },
            ]}
          >
            {board.map((value, index) => {
              const row = Math.floor(index / difficulty);
              const col = index % difficulty;
              const isEmpty = value === 0;

              return (
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.85}
                  onPress={() => moveTile(index)}
                  style={[
                    styles.tile,
                    {
                      width: tileSize,
                      height: tileSize,
                      left: col * tileSize,
                      top: row * tileSize,
                    },
                    isEmpty && styles.emptyTile,
                  ]}
                >
                  {!isEmpty && (
                    <>
                      <Image
                        source={{ uri: photo.uri }}
                        resizeMode="stretch"
                        style={{
                          position: 'absolute',
                          width: boardWidth,
                          height: boardWidth,
                          maxWidth: undefined,
                          left: -((value - 1) % difficulty) * tileSize,
                          top: -Math.floor(
                            (value - 1) / difficulty
                          ) * tileSize,
                        }}
                      />

                      <View style={styles.tileNumber}>
                        <Text style={styles.tileNumberText}>
                          {value}
                        </Text>
                      </View>
                    </>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <Text style={styles.hint}>
          {won
            ? 'You did it! Ready for another challenge?'
            : '💡 Only tiles next to the empty space can move.'}
        </Text>

        {won
          ? renderButton('↻  Play Again', restartGame)
          : renderButton('↻  Shuffle & Restart', restartGame)}

        {renderButton('⌂  Back to Home', goHome, '#26344A')}
      </ScrollView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />
      {screen === 'home' ? renderHome() : renderGame()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  content: {
    padding: 22,
    paddingBottom: 42,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 30,
    gap: 13,
  },

  logo: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#7928CA',
    justifyContent: 'center',
    alignItems: 'center',
  },

  logoText: {
    fontSize: 28,
  },

  appName: {
    fontSize: 25,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  tagline: {
    color: '#A5A5C7',
    fontSize: 12,
    marginTop: 3,
  },

  hero: {
    backgroundColor: CARD,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: '#34304E',
    marginBottom: 30,
    gap: 12,
  },

  eyebrow: {
    color: CYAN,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
  },

  heroTitle: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 38,
  },

  description: {
    color: '#B8B6D5',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
  },

  button: {
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 15,
  },

  difficultyRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },

  difficultyCard: {
    flex: 1,
    paddingVertical: 20,
    alignItems: 'center',
    backgroundColor: CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#34304E',
  },

  selectedCard: {
    backgroundColor: '#292044',
    borderColor: PURPLE,
    borderWidth: 2,
  },

  gridSize: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 7,
  },

  difficultyName: {
    color: '#A5A5C7',
    fontSize: 12,
  },

  selectedText: {
    color: '#C4B5FD',
    fontWeight: '700',
  },

  previewCard: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },

  previewImage: {
    width: 58,
    height: 58,
    borderRadius: 10,
  },

  photoTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: 5,
  },

  photoDescription: {
    color: '#A5A5C7',
    fontSize: 12,
  },

  footer: {
    color: '#666580',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 32,
    letterSpacing: 1,
  },

  gameContent: {
    alignItems: 'center',
    padding: 20,
    paddingBottom: 40,
  },

  gameHeader: {
    width: '100%',
    maxWidth: 440,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },

  backButton: {
    color: CYAN,
    fontSize: 15,
    fontWeight: '700',
  },

  gameTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
  },

  gameSubtitle: {
    color: '#A5A5C7',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 22,
  },

  statsRow: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 440,
    gap: 10,
    marginBottom: 20,
  },

  statCard: {
    flex: 1,
    backgroundColor: CARD,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },

  statLabel: {
    color: CYAN,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },

  statValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 5,
  },

  board: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: PURPLE,
    backgroundColor: '#090912',
  },

  tile: {
    position: 'absolute',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#10101B',
    backgroundColor: '#292044',
  },

  emptyTile: {
    backgroundColor: '#090912',
    borderWidth: 1,
    borderColor: '#34304E',
  },

  tileNumber: {
    position: 'absolute',
    top: 4,
    left: 4,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(16,16,27,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  tileNumberText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },

  hint: {
    color: '#A5A5C7',
    textAlign: 'center',
    lineHeight: 22,
    marginVertical: 20,
  },
});
