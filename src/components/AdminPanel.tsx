"use client";

import React, { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import {
  TrashIcon,
  PlusIcon,
  Cross1Icon,
  ExclamationTriangleIcon,
  CheckIcon,
  DiscIcon,
} from "@radix-ui/react-icons";
import Link from "next/link";
import { et } from "date-fns/locale";

interface Participant {
  name: string;
  availableDates: { date: string }[];
}

interface Voter {
  name: string;
}

interface AdminPanelProps {
  onRefresh: () => void;
}

interface VoteDetails {
  name: string;
  dates: string[];
}

export function AdminPanel({ onRefresh }: AdminPanelProps) {
  const [votes, setVotes] = useState<VoteDetails[]>([]);
  const [headerText, setHeaderText] = useState("");
  const [voters, setVoters] = useState<string[]>([]);
  const [newVoter, setNewVoter] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [startMonth, setStartMonth] = useState<string>("");
  const [endMonth, setEndMonth] = useState<string>("");

  const fetchVotes = useCallback(async () => {
    const response = await fetch("/api/admin/votes");
    const data = await response.json();

    if (!response.ok) {
      showMessage("Viga häälte laadimisel", "error");
      return;
    }

    setVotes(
      data.map((participant: Participant) => ({
        name: participant.name,
        dates: participant.availableDates.map((d) => d.date),
      }))
    );
  }, []);

  const fetchHeaderText = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/header");
      const data = await response.json();

      if (response.ok) {
        setHeaderText(data.text || "");
      } else {
        showMessage("Viga päise teksti laadimisel", "error");
      }
    } catch {
      showMessage("Viga päise teksti laadimisel", "error");
    }
  }, []);

  const fetchVoters = useCallback(async () => {
    const response = await fetch("/api/admin/voters");
    const data = await response.json();

    if (!response.ok) {
      showMessage("Viga hääletajate laadimisel", "error");
      return;
    }

    setVoters(data.map((v: Voter) => v.name));
  }, []);

  const fetchVotingPeriod = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/voting-period");
      const data = await response.json();

      if (response.ok && data.startDate && data.endDate) {
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);

        setStartMonth(
          `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(
            2,
            "0"
          )}`
        );
        setEndMonth(
          `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}`
        );
      }
    } catch (error) {
      console.error("Voting period fetch error:", error);
      showMessage("Viga hääletusperioodi laadimisel", "error");
    }
  }, []);

  useEffect(() => {
    fetchVotes();
    fetchHeaderText();
    fetchVoters();
    fetchVotingPeriod();
  }, [fetchVotes, fetchHeaderText, fetchVoters, fetchVotingPeriod]);

  const handleSaveHeaderText = async () => {
    const response = await fetch("/api/admin/header", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ headerText }),
    });

    if (!response.ok) {
      showMessage("Viga päise teksti salvestamisel", "error");
    } else {
      showMessage("Päise tekst salvestatud", "success");
      onRefresh();
    }
  };

  const handleDeleteVote = async (name: string) => {
    if (!confirm(`Kas olete kindel, et soovite kustutada ${name} hääle?`))
      return;

    const response = await fetch("/api/admin/votes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      showMessage("Viga hääle kustutamisel", "error");
    } else {
      showMessage("Hääl edukalt kustutatud", "success");
      fetchVotes();
      onRefresh();
    }
  };

  const handleDeleteAllVotes = async () => {
    if (!confirm("Kas olete kindel, et soovite kustutada KÕIK hääled?")) return;

    const response = await fetch("/api/admin/all", {
      method: "DELETE",
    });

    if (!response.ok) {
      showMessage("Viga kõikide häälte kustutamisel", "error");
    } else {
      showMessage("Kõik hääled edukalt kustutatud", "success");
      fetchVotes();
      onRefresh();
    }
  };

  const handleAddVoter = async () => {
    if (!newVoter.trim()) return;

    const response = await fetch("/api/admin/voters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newVoter.trim() }),
    });

    if (!response.ok) {
      showMessage("Viga hääletaja lisamisel", "error");
    } else {
      showMessage("Hääletaja edukalt lisatud", "success");
      setNewVoter("");
      fetchVoters();
    }
  };

  const handleRemoveVoter = async (name: string) => {
    if (
      !confirm(
        `Kas olete kindel, et soovite eemaldada ${name} lubatud hääletajate seast?`
      )
    )
      return;

    const response = await fetch("/api/admin/voters", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      showMessage("Viga hääletaja eemaldamisel", "error");
    } else {
      showMessage("Hääletaja edukalt eemaldatud", "success");
      fetchVoters();
    }
  };

  const handleSaveVotingPeriod = async () => {
    // Create dates in UTC to avoid timezone issues
    const startParts = startMonth.split("-");
    const endParts = endMonth.split("-");

    const start = new Date(
      parseInt(startParts[0]), // year
      parseInt(startParts[1]) - 1, // month (0-based)
      1, // day
      12, // hour
      0 // minute
    );

    const end = new Date(
      parseInt(endParts[0]), // year
      parseInt(endParts[1]) - 1, // month (0-based)
      1, // day
      23, // hour
      59 // minute
    );

    const response = await fetch("/api/admin/voting-period", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      }),
    });

    if (!response.ok) {
      showMessage("Viga hääletusperioodi salvestamisel", "error");
    } else {
      showMessage("Hääletusperiood salvestatud", "success");
      onRefresh();
    }
  };

  const getMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + i,
        1
      );
      options.push({
        value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
          2,
          "0"
        )}`, // YYYY-MM format
        label: format(date, "MMMM yyyy", { locale: et }), // Add Estonian locale
      });
    }
    return options;
  };

  const showMessage = (text: string, type: string) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  return (
    <div className="min-h-screen bg-transparent py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-gray-900 rounded-lg shadow-2xl border border-yellow-500/20 p-6 space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-yellow-400">
              Administraatori Paneel
            </h1>
            <Link href="/" className="text-gray-400 hover:text-gray-300">
              Tagasi avalehele
            </Link>
          </div>

          {message.text && (
            <div
              className={`p-4 rounded-lg flex items-center gap-2 ${
                message.type === "error"
                  ? "bg-red-900/50 text-red-400"
                  : "bg-green-900/50 text-green-400"
              }`}
            >
              {message.type === "error" ? (
                <ExclamationTriangleIcon className="w-5 h-5" />
              ) : (
                <CheckIcon className="w-5 h-5" />
              )}
              {message.text}
            </div>
          )}

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-300">Päise Tekst</h2>
            <div className="flex gap-2">
              <textarea
                value={headerText}
                onChange={(e) => setHeaderText(e.target.value)}
                className="flex-1 bg-gray-800 text-gray-300 rounded-lg p-3 border border-gray-700 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                rows={3}
              />
              <button
                onClick={handleSaveHeaderText}
                className="bg-yellow-500 text-gray-900 px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors"
              >
                <DiscIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-300">
              Hääletusperiood
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Alguskuu</label>
                <select
                  value={startMonth}
                  onChange={(e) => setStartMonth(e.target.value)}
                  className="w-full bg-gray-800 text-gray-300 rounded-lg px-4 py-2 border border-gray-700 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                >
                  <option value="">Vali kuu</option>
                  {getMonthOptions().map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Lõppkuu</label>
                <select
                  value={endMonth}
                  onChange={(e) => setEndMonth(e.target.value)}
                  className="w-full bg-gray-800 text-gray-300 rounded-lg px-4 py-2 border border-gray-700 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                >
                  <option value="">Vali kuu</option>
                  {getMonthOptions()
                    .filter(
                      (option) => option.value >= startMonth || !startMonth
                    )
                    .map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <button
              onClick={handleSaveVotingPeriod}
              disabled={!startMonth || !endMonth || startMonth > endMonth}
              className="bg-yellow-500 text-gray-900 px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Salvesta periood
            </button>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-300">Hääletajad</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={newVoter}
                onChange={(e) => setNewVoter(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddVoter();
                  }
                }}
                placeholder="Uue hääletaja nimi"
                className="flex-1 bg-gray-800 text-gray-300 rounded-lg px-4 py-2 border border-gray-700 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
              />
              <button
                onClick={handleAddVoter}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-500 transition-colors"
              >
                <PlusIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {voters.map((voter) => (
                <div
                  key={voter}
                  className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-2"
                >
                  <span className="text-gray-300">{voter}</span>
                  <button
                    onClick={() => handleRemoveVoter(voter)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Cross1Icon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-300">
              Praegused Hääled
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="py-3 px-4 text-gray-400">Nimi</th>
                    <th className="py-3 px-4 text-gray-400">Kuupäevad</th>
                    <th className="py-3 px-4 text-gray-400">Kustuta</th>
                  </tr>
                </thead>
                <tbody>
                  {votes.map((vote) => (
                    <tr key={vote.name} className="border-b border-gray-800">
                      <td className="py-3 px-4 text-gray-300">{vote.name}</td>
                      <td className="py-3 px-4 text-gray-400">
                        <div className="flex flex-wrap gap-1">
                          {vote.dates.map((date) => (
                            <span
                              key={date}
                              className="bg-gray-800 px-2 py-1 rounded text-sm"
                            >
                              {format(new Date(date), "dd.MM")}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleDeleteVote(vote.name)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {votes.length > 0 && (
              <button
                onClick={handleDeleteAllVotes}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-500 transition-colors flex items-center gap-2"
              >
                <TrashIcon className="w-5 h-5" />
                Kustuta Kõik Hääled
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
