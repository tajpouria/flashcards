"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Auth, { useAuth } from "@/components/Auth";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Rotate3D,
  FolderPlus,
  ArrowLeft,
  Play,
  X,
  Check,
  List,
  Pencil,
  Save,
  Trash2,
  Brain,
} from "lucide-react";

interface FlashCard {
  front: string;
  back: string;
}

interface Group {
  name: string;
  cards: FlashCard[];
}

export default function FlashcardApp() {
  const { user, logout } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [currentGroupIndex, setCurrentGroupIndex] = useState<number | null>(
    null
  );
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newFront, setNewFront] = useState("");
  const [newBack, setNewBack] = useState("");
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [isListView, setIsListView] = useState(false);
  const [editingCard, setEditingCard] = useState<{
    index: number;
    front: string;
    back: string;
  } | null>(null);

  const [isQuizMode, setIsQuizMode] = useState(false);
  const [quizCards, setQuizCards] = useState<FlashCard[]>([]);
  const [userAnswer, setUserAnswer] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [editingGroupName, setEditingGroupName] = useState("");

  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);

  const saveUserData = async () => {
    if (!user) return;

    setIsSaving(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/flashcards", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(groups),
      });

      if (!response.ok) {
        throw new Error("Failed to save changes");
      }
    } catch (error) {
      console.error("Error saving flashcards:", error);
      setError("Failed to save changes. Please try again.");
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const loadGroups = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("/api/flashcards", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to load flashcards");
        }

        const { data } = await response.json();
        setGroups(data || []);
      } catch (error) {
        console.error("Error loading flashcards:", error);
        setError("Failed to load flashcards. Please refresh the page.");
      } finally {
        setIsLoading(false);
      }
    };

    loadGroups();
  }, [user]);

  const startEditingGroupName = (name: string) => {
    setEditingGroupName(name);
    setIsEditingGroup(true);
  };

  const saveGroupName = async () => {
    if (editingGroupName.trim() && currentGroupIndex !== null) {
      try {
        setIsSaving(true);
        const updatedGroups = [...groups];
        updatedGroups[currentGroupIndex].name = editingGroupName.trim();

        const token = localStorage.getItem("token");
        const response = await fetch("/api/flashcards", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedGroups),
        });

        if (!response.ok) {
          throw new Error("Failed to update group name");
        }

        setGroups(updatedGroups);
        setIsEditingGroup(false);
        setEditingGroupName("");
      } catch (error) {
        console.error("Error updating group name:", error);
        setError("Failed to update group name. Please try again.");
      } finally {
        setIsSaving(false);
      }
    }
  };

  const deleteGroup = async (index: number) => {
    try {
      setIsSaving(true);
      const updatedGroups = [...groups];
      updatedGroups.splice(index, 1);

      const token = localStorage.getItem("token");
      const response = await fetch("/api/flashcards", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedGroups),
      });

      if (!response.ok) {
        throw new Error("Failed to delete group");
      }

      setGroups(updatedGroups);
      setCurrentGroupIndex(null);
    } catch (error) {
      console.error("Error deleting group:", error);
      setError("Failed to delete group. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const addGroup = async () => {
    if (newGroupName.trim()) {
      try {
        setIsSaving(true); // Show saving indicator
        const updatedGroups = [...groups, { name: newGroupName, cards: [] }];

        // First save to storage
        const token = localStorage.getItem("token");
        const response = await fetch("/api/flashcards", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedGroups),
        });

        if (!response.ok) {
          throw new Error("Failed to save group");
        }

        // If save was successful, update local state
        setGroups(updatedGroups);
        setNewGroupName("");
      } catch (error) {
        console.error("Error adding group:", error);
        setError("Failed to create group. Please try again.");
      } finally {
        setIsSaving(false);
      }
    }
  };

  const addCard = async () => {
    if (newFront.trim() && newBack.trim() && currentGroupIndex !== null) {
      try {
        setIsSaving(true);
        const updatedGroups = [...groups];
        updatedGroups[currentGroupIndex].cards.push({
          front: newFront,
          back: newBack,
        });

        // Save to storage first
        const token = localStorage.getItem("token");
        const response = await fetch("/api/flashcards", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedGroups),
        });

        if (!response.ok) {
          throw new Error("Failed to save card");
        }

        // If save was successful, update local state
        setGroups(updatedGroups);
        setNewFront("");
        setNewBack("");
        setIsAddingCard(false);
      } catch (error) {
        console.error("Error adding card:", error);
        setError("Failed to add card. Please try again.");
      } finally {
        setIsSaving(false);
      }
    }
  };

  const startEditingCard = async (index: number) => {
    const card = groups[currentGroupIndex!].cards[index];
    setEditingCard({
      index,
      front: card.front,
      back: card.back,
    });
  };

  const saveEditingCard = async () => {
    if (
      editingCard?.front.trim() &&
      editingCard?.back.trim() &&
      currentGroupIndex !== null
    ) {
      try {
        setIsSaving(true);
        const updatedGroups = [...groups];
        updatedGroups[currentGroupIndex].cards[editingCard.index] = {
          front: editingCard.front,
          back: editingCard.back,
        };

        // Save to storage first
        const token = localStorage.getItem("token");
        const response = await fetch("/api/flashcards", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedGroups),
        });

        if (!response.ok) {
          throw new Error("Failed to save card changes");
        }

        // If save was successful, update local state
        setGroups(updatedGroups);
        setEditingCard(null);
      } catch (error) {
        console.error("Error updating card:", error);
        setError("Failed to update card. Please try again.");
      } finally {
        setIsSaving(false);
      }
    }
  };

  const deleteCard = async (index: number) => {
    if (currentGroupIndex === null) return;

    try {
      setIsSaving(true);
      const updatedGroups = [...groups];
      updatedGroups[currentGroupIndex].cards.splice(index, 1);

      // Save to storage first
      const token = localStorage.getItem("token");
      const response = await fetch("/api/flashcards", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedGroups),
      });

      if (!response.ok) {
        throw new Error("Failed to delete card");
      }

      // If save was successful, update local state
      setGroups(updatedGroups);
      if (currentCardIndex >= index) {
        setCurrentCardIndex(Math.max(0, currentCardIndex - 1));
      }
    } catch (error) {
      console.error("Error deleting card:", error);
      setError("Failed to delete card. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const startQuiz = () => {
    if (currentGroupIndex === null) return;

    const shuffledCards = [...groups[currentGroupIndex].cards];
    for (let i = shuffledCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledCards[i], shuffledCards[j]] = [
        shuffledCards[j],
        shuffledCards[i],
      ];
    }
    setQuizCards(shuffledCards);
    setCurrentCardIndex(0);
    setIsQuizMode(true);
    setQuizScore(0);
    setTotalAttempts(0);
    setUserAnswer("");
    setShowAnswer(false);
  };

  const checkAnswer = () => {
    const correct =
      userAnswer.trim().toLowerCase() ===
      quizCards[currentCardIndex].back.trim().toLowerCase();
    setShowAnswer(true);
    setTotalAttempts(totalAttempts + 1);
    if (correct) {
      setQuizScore(quizScore + 1);
    }
  };

  const nextQuizCard = () => {
    if (currentCardIndex < quizCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setUserAnswer("");
      setShowAnswer(false);
    } else {
      setIsQuizMode(false);
    }
  };

  const selectGroup = (index: number) => {
    setCurrentGroupIndex(index);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setIsQuizMode(false);
    setIsListView(false);
    setEditingCard(null);
  };

  const exitGroup = () => {
    setCurrentGroupIndex(null);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setIsQuizMode(false);
    setIsListView(false);
    setEditingCard(null);
  };

  const nextCard = () => {
    if (
      currentGroupIndex !== null &&
      currentCardIndex < groups[currentGroupIndex].cards.length - 1
    ) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
    }
  };

  const prevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setIsFlipped(false);
    }
  };

  const flipCard = () => {
    setIsFlipped(!isFlipped);
  };

  if (!user) {
    return <Auth />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">Loading flashcards...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto p-4">
        <div className="bg-red-800/20 text-red-400 p-4 rounded-lg">
          <p>{error}</p>
          <Button
            onClick={() => setError(null)}
            className="mt-2 bg-red-600 hover:bg-red-700"
          >
            Dismiss
          </Button>
        </div>
      </div>
    );
  }

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20,
      },
    },
    flipped: {
      rotateY: 180,
      transition: {
        type: "tween",
        duration: 0.5,
      },
    },
  };

  // Group Selection View
  if (currentGroupIndex === null) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-xl mx-auto p-4 space-y-4"
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <p className="font-bold text-gray-100">Welcome, {user + " 😊"}</p>
          </div>
          <Button
            onClick={logout}
            variant="ghost"
            className="text-red-500 hover:text-red-400 hover:bg-gray-800"
          >
            Logout
          </Button>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={() => setIsAddGroupModalOpen(true)}
            className="w-full mb-4 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <FolderPlus className="mr-2 h-4 w-4" />
            🌟 Create Study Group
          </Button>
        </motion.div>

        {isAddGroupModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <Card className="w-full max-w-md bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-gray-100 mb-4">
                  Create New Group
                </h2>
                <div className="space-y-4">
                  <Input
                    placeholder="Enter group name"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="bg-gray-700 text-gray-100 border-gray-600"
                  />
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setIsAddGroupModalOpen(false);
                        setNewGroupName("");
                      }}
                      className="text-gray-400 hover:text-gray-300"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={async () => {
                        await addGroup();
                        setIsAddGroupModalOpen(false);
                      }}
                      disabled={!newGroupName.trim() || isSaving}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isSaving ? "Creating..." : "Create Group"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <AnimatePresence>
          <div className="space-y-2">
            {groups.map((group, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className="bg-gradient-to-r from-indigo-600/10 to-purple-600/10 border-indigo-500/20 hover:bg-indigo-600/20 cursor-pointer transition-all"
                  onClick={() => selectGroup(index)}
                >
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <h2 className="text-lg font-bold text-indigo-900 dark:text-indigo-200">
                        📚 {group.name}
                      </h2>
                      <p className="text-sm text-indigo-600 dark:text-indigo-400">
                        {group.cards.length} flashcards 🃏
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-indigo-500" />
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {groups.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center p-8 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg"
              >
                <Brain className="mx-auto h-12 w-12 text-indigo-500 mb-4" />
                <p className="text-indigo-800 dark:text-indigo-200">
                  🚀 Your learning journey starts here! Create your first study
                  group.
                </p>
              </motion.div>
            )}
          </div>
        </AnimatePresence>
      </motion.div>
    );
  }

  const currentGroup = groups[currentGroupIndex];

  // Quiz Mode View
  if (isQuizMode && quizCards.length > 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-xl mx-auto p-4 space-y-4"
      >
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => setIsQuizMode(false)}
            className="text-gray-300 hover:text-gray-100 hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Exit Quiz
          </Button>
          <div className="text-right">
            <p className="text-sm text-gray-400">
              Score: {quizScore}/{totalAttempts}
            </p>
            <p className="text-sm text-gray-400">
              Card {currentCardIndex + 1} of {quizCards.length}
            </p>
          </div>
        </div>

        <Card className="bg-gray-800 border-gray-700 p-6">
          <div className="space-y-4">
            <div className="text-lg text-gray-100 whitespace-pre-wrap">
              {quizCards[currentCardIndex].front}
            </div>

            <Textarea
              placeholder="Enter your answer..."
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              disabled={showAnswer}
              className="min-h-24 bg-gray-800 text-gray-100 border-gray-700 placeholder-gray-400"
            />

            {!showAnswer ? (
              <Button
                onClick={checkAnswer}
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={!userAnswer.trim()}
              >
                Check Answer
              </Button>
            ) : (
              <div className="space-y-4">
                <div
                  className={`flex items-center justify-center p-3 rounded-lg ${
                    userAnswer.trim().toLowerCase() ===
                    quizCards[currentCardIndex].back.trim().toLowerCase()
                      ? "bg-green-800/20 text-green-400"
                      : "bg-red-800/20 text-red-400"
                  }`}
                >
                  {userAnswer.trim().toLowerCase() ===
                  quizCards[currentCardIndex].back.trim().toLowerCase() ? (
                    <div className="flex items-center">
                      <Check className="h-5 w-5 mr-2" />
                      Correct!
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <X className="h-5 w-5 mr-2" />
                      Incorrect - Correct answer:{" "}
                      {quizCards[currentCardIndex].back}
                    </div>
                  )}
                </div>

                <Button
                  onClick={nextQuizCard}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {currentCardIndex < quizCards.length - 1
                    ? "Next Card"
                    : "Finish Quiz"}
                </Button>
              </div>
            )}
          </div>
        </Card>
        {isSaving && (
          <div className="fixed bottom-4 right-4 bg-gray-800 text-gray-100 px-4 py-2 rounded-lg shadow-lg">
            Saving changes...
          </div>
        )}
      </motion.div>
    );
  }

  // List View
  if (isListView) {
    return (
      <div className="max-w-xl mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button
              variant="ghost"
              onClick={() => setIsListView(false)}
              className="mr-2 text-gray-300 hover:text-gray-100 hover:bg-gray-800"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
            </Button>
            <h2 className="text-2xl font-bold text-gray-100 truncate w-36">
              {currentGroup.name}
            </h2>
          </div>
        </div>

        <div className="space-y-4">
          {currentGroup.cards.map((card, index) => (
            <Card key={index} className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                {editingCard?.index === index ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Front of card
                      </label>
                      <Textarea
                        value={editingCard.front}
                        onChange={(e) =>
                          setEditingCard({
                            ...editingCard,
                            front: e.target.value,
                          })
                        }
                        className="min-h-24 bg-gray-800 text-gray-100 border-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Back of card
                      </label>
                      <Textarea
                        value={editingCard.back}
                        onChange={(e) =>
                          setEditingCard({
                            ...editingCard,
                            back: e.target.value,
                          })
                        }
                        className="min-h-24 bg-gray-800 text-gray-100 border-gray-700"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        onClick={() => setEditingCard(null)}
                        className="text-gray-400 hover:text-gray-300"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={async () => await saveEditingCard()}
                        disabled={
                          isSaving ||
                          !editingCard?.front.trim() ||
                          !editingCard?.back.trim()
                        }
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {isSaving ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-400 mb-1">
                        Front
                      </h3>
                      <p className="text-gray-100 whitespace-pre-wrap">
                        {card.front}
                      </p>
                    </div>
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-400 mb-1">
                        Back
                      </h3>
                      <p className="text-gray-100 whitespace-pre-wrap">
                        {card.back}
                      </p>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        onClick={() => startEditingCard(index)}
                        className="text-gray-400 hover:text-gray-300"
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={async () => await deleteCard(index)}
                        disabled={isSaving}
                        className="text-red-500 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {isSaving ? "Deleting..." : "Delete"}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Regular Flashcard View
  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            onClick={exitGroup}
            className="mr-2 text-gray-300 hover:text-gray-100 hover:bg-gray-800"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
          </Button>
          <div className="flex items-center space-x-2">
            <h2 className="text-2xl font-bold text-gray-100 truncate w-36">
              {currentGroup.name}
            </h2>
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setEditingGroupName(currentGroup.name);
                  setIsEditingGroup(true);
                }}
                className="text-gray-400 hover:text-gray-300"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                onClick={() => setIsDeleteModalOpen(true)}
                className="text-red-500 hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <Button
          onClick={() => setIsAddingCard(!isAddingCard)}
          className="w-full mb-4 bg-gray-800 hover:bg-gray-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          {isAddingCard ? "Cancel" : "Add New Flashcard"}
        </Button>

        {currentGroup.cards.length > 0 && !isAddingCard && (
          <Button
            onClick={() => setIsListView(true)}
            className="w-full mb-4 bg-yellow-800 hover:bg-yellow-700"
          >
            <List className="h-4 w-4 mr-2" />
            View All
          </Button>
        )}

        {currentGroup.cards.length > 0 && !isAddingCard && (
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              onClick={startQuiz}
              className="w-full mb-4 bg-green-600 hover:bg-green-700 text-white"
            >
              <Play className="h-4 w-4 mr-2" />
              Quiz
            </Button>
          </motion.div>
        )}

        {isAddingCard && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Front of card
              </label>
              <Textarea
                placeholder="Enter the question or prompt"
                value={newFront}
                onChange={(e) => setNewFront(e.target.value)}
                className="min-h-24 bg-gray-800 text-gray-100 border-gray-700 placeholder-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Back of card
              </label>
              <Textarea
                placeholder="Enter the answer or explanation"
                value={newBack}
                onChange={(e) => setNewBack(e.target.value)}
                className="min-h-24 bg-gray-800 text-gray-100 border-gray-700 placeholder-gray-400"
              />
            </div>
            <Button
              onClick={async () => await addCard()}
              disabled={isSaving || !newFront.trim() || !newBack.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isSaving ? "Creating..." : "Create Flashcard"}
            </Button>
          </div>
        )}
      </div>

      {currentGroup.cards.length > 0 ? (
        <div className="space-y-4">
          <Card
            className="h-64 cursor-pointer relative bg-gray-800 border-gray-700 hover:bg-gray-700 transition-colors"
            onClick={flipCard}
          >
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center p-4 w-full">
                <p className="text-lg text-gray-100 whitespace-pre-wrap">
                  {isFlipped
                    ? currentGroup.cards[currentCardIndex].back
                    : currentGroup.cards[currentCardIndex].front}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute bottom-2 right-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    flipCard();
                  }}
                >
                  <Rotate3D className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between items-center">
            <Button
              onClick={prevCard}
              disabled={currentCardIndex === 0}
              variant="outline"
              className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-gray-100"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-gray-400">
              Card {currentCardIndex + 1} of {currentGroup.cards.length}
            </span>
            <Button
              onClick={nextCard}
              disabled={currentCardIndex === currentGroup.cards.length - 1}
              variant="outline"
              className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-gray-100"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : !isAddingCard ? (
        <div className="text-center p-8 text-gray-400 bg-gray-800 rounded-lg">
          No flashcards in this group yet. Click "Add New Flashcard" to get
          started!
        </div>
      ) : null}

      {isEditingGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-gray-100 mb-4">
                Edit Group Name
              </h2>
              <div className="space-y-4">
                <Input
                  placeholder="Enter new group name"
                  value={editingGroupName}
                  onChange={(e) => setEditingGroupName(e.target.value)}
                  className="bg-gray-700 text-gray-100 border-gray-600"
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setIsEditingGroup(false);
                      setEditingGroupName("");
                    }}
                    className="text-gray-400 hover:text-gray-300"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={saveGroupName}
                    disabled={!editingGroupName.trim() || isSaving}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-gray-100 mb-4">
                Delete Group
              </h2>
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete this group? This action cannot
                be undone.
              </p>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="ghost"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="text-gray-400 hover:text-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    await deleteGroup(currentGroupIndex!);
                    setIsDeleteModalOpen(false);
                  }}
                  disabled={isSaving}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isSaving ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
