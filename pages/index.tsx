"use client";

import React, { useEffect, useState } from "react";
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
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [currentGroupIndex, setCurrentGroupIndex] = useState<number | null>(
    null
  );
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newFront, setNewFront] = useState("");
  const [newBack, setNewBack] = useState("");
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [isListView, setIsListView] = useState(false);
  const [editingCard, setEditingCard] = useState<{
    index: number;
    front: string;
    back: string;
  } | null>(null);

  // Quiz-related state
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [quizCards, setQuizCards] = useState<FlashCard[]>([]);
  const [userAnswer, setUserAnswer] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);

  useEffect(() => {
    const loadGroups = async () => {
      if (!user) return;

      try {
        const token = localStorage.getItem("token");
        const response = await fetch("/api/flashcards", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const { data } = await response.json();
          setGroups(data || []);
        }
      } catch (error) {
        console.error("Error loading flashcards:", error);
      }
    };

    loadGroups();
  }, [user]);

  const saveUserData = async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem("token");
      await fetch("/api/flashcards", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(groups),
      });
    } catch (error) {
      console.error("Error saving user data:", error);
    }
  };

  const addGroup = async () => {
    if (newGroupName.trim()) {
      const updatedGroups = [...groups, { name: newGroupName, cards: [] }];
      setGroups(updatedGroups);
      setNewGroupName("");
      setIsAddingGroup(false);
      await saveUserData();
    }
  };

  const addCard = () => {
    if (newFront.trim() && newBack.trim() && currentGroupIndex !== null) {
      const updatedGroups = [...groups];
      updatedGroups[currentGroupIndex].cards.push({
        front: newFront,
        back: newBack,
      });
      setGroups(updatedGroups);
      setNewFront("");
      setNewBack("");
      setIsAddingCard(false);
    }
  };

  const startEditingCard = (index: number) => {
    const card = groups[currentGroupIndex!].cards[index];
    setEditingCard({
      index,
      front: card.front,
      back: card.back,
    });
  };

  const saveEditingCard = () => {
    if (
      editingCard?.front.trim() &&
      editingCard?.back.trim() &&
      currentGroupIndex !== null
    ) {
      const updatedGroups = [...groups];
      updatedGroups[currentGroupIndex].cards[editingCard.index] = {
        front: editingCard.front,
        back: editingCard.back,
      };
      setGroups(updatedGroups);
      setEditingCard(null);
    }
  };

  const deleteCard = (index: number) => {
    if (currentGroupIndex === null) return;

    const updatedGroups = [...groups];
    updatedGroups[currentGroupIndex].cards.splice(index, 1);
    setGroups(updatedGroups);
    if (currentCardIndex >= index) {
      setCurrentCardIndex(Math.max(0, currentCardIndex - 1));
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

  // Group Selection View
  if (currentGroupIndex === null) {
    return (
      <div className="max-w-xl mx-auto p-4 space-y-4">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-100">
          Flashcard Groups
        </h1>
        <Button
          onClick={() => setIsAddingGroup(!isAddingGroup)}
          className="w-full mb-4 bg-gray-800 hover:bg-gray-700"
        >
          <FolderPlus className="mr-2 h-4 w-4" />
          {isAddingGroup ? "Cancel" : "Create New Group"}
        </Button>

        {isAddingGroup && (
          <div className="space-y-4">
            <Input
              placeholder="Group name"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="mb-2 bg-gray-800 text-gray-100 border-gray-700 placeholder-gray-400"
            />
            <Button
              onClick={addGroup}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Create Group
            </Button>
          </div>
        )}

        <div className="space-y-2">
          {groups.map((group, index) => (
            <Card
              key={index}
              className="bg-gray-800 border-gray-700 hover:bg-gray-700 cursor-pointer"
              onClick={() => selectGroup(index)}
            >
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-100">
                    {group.name}
                  </h2>
                  <p className="text-sm text-gray-400">
                    {group.cards.length} cards
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </CardContent>
            </Card>
          ))}

          {groups.length === 0 && !isAddingGroup && (
            <div className="text-center p-8 text-gray-400 bg-gray-800 rounded-lg">
              No groups yet. Click "Create New Group" to get started!
            </div>
          )}
        </div>
      </div>
    );
  }

  const currentGroup = groups[currentGroupIndex];

  // Quiz Mode View
  if (isQuizMode && quizCards.length > 0) {
    return (
      <div className="max-w-xl mx-auto p-4 space-y-4">
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
      </div>
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
              Back
            </Button>
            <h1 className="text-2xl font-bold text-gray-100">
              {currentGroup.name}
            </h1>
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
                        onClick={saveEditingCard}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
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
                        onClick={() => deleteCard(index)}
                        className="text-red-500 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
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
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-100">
            {currentGroup.name}
          </h1>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => setIsListView(true)}
            className="bg-gray-800 hover:bg-gray-700"
          >
            <List className="h-4 w-4 mr-2" />
            View All
          </Button>
          {currentGroup.cards.length > 0 && (
            <Button
              onClick={startQuiz}
              className="bg-green-600 hover:bg-green-700"
            >
              <Play className="h-4 w-4 mr-2" />
              Start Quiz
            </Button>
          )}
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
              onClick={addCard}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Create Flashcard
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
      ) : (
        <div className="text-center p-8 text-gray-400 bg-gray-800 rounded-lg">
          No flashcards in this group yet. Click "Add New Flashcard" to get
          started!
        </div>
      )}
    </div>
  );
}
