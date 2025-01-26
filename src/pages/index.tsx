"use client";

import { Calendar } from "@/components/Calendar";
import { ResultsCalendar } from "@/components/ResultsCalendar";
import {
  PersonIcon,
  UpdateIcon,
  CheckIcon,
  PlayIcon,
} from "@radix-ui/react-icons";
import { useEffect, useState, useCallback } from "react";
import { addMonths, startOfMonth, format, differenceInMonths } from "date-fns";
import { useRouter } from "next/router";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowRightIcon } from "@radix-ui/react-icons";

interface VoterData {
  name: string;
  hasVoted: boolean;
  votedAt: string | null;
}

interface DateCount {
  date: string;
  _count: { date: number };
}

export default function Home() {
  const router = useRouter();
  const [selectedVoter, setSelectedVoter] = useState<string | null>(null);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [voters, setVoters] = useState<VoterData[]>([]);
  const [error, setError] = useState<string>("");
  const [resetMessage, setResetMessage] = useState<string>("");
  const [headerText, setHeaderText] = useState<string>("");
  const [dateData, setDateData] = useState<
    { date: string; _count: { date: number }; voters: string[] }[]
  >([]);
  const [votingPeriod, setVotingPeriod] = useState<{
    startDate: Date;
    endDate: Date;
  } | null>(null);

  const handleReset = useCallback(async (resetTarget: string) => {
    try {
      let success = false;

      if (resetTarget.toLowerCase() === "all") {
        await prisma.$transaction([
          prisma.availableDate.deleteMany({}),
          prisma.participant.deleteMany({}),
          prisma.allowedVoter.updateMany({
            data: { hasVoted: false, votedAt: null },
          }),
        ]);
        success = true;
      } else {
        // Check if user is admin
        const isAdmin = await prisma.admin.findUnique({
          where: { name: resetTarget },
        });

        if (isAdmin) {
          // Reset all votes as admin
          await prisma.$transaction([
            prisma.availableDate.deleteMany({}),
            prisma.participant.deleteMany({}),
            prisma.allowedVoter.updateMany({
              data: { hasVoted: false, votedAt: null },
            }),
          ]);
          success = true;
        } else {
          // Reset individual votes
          const voter = await prisma.allowedVoter.findUnique({
            where: { name: resetTarget },
          });

          if (voter) {
            await prisma.$transaction([
              prisma.participant.deleteMany({
                where: { name: resetTarget },
              }),
              prisma.allowedVoter.update({
                where: { name: resetTarget },
                data: { hasVoted: false, votedAt: null },
              }),
            ]);
            success = true;
          }
        }
      }

      if (success) {
        setResetMessage("Hääletused on tühistatud!");
        await Promise.all([fetchOverlappingDates(), fetchVoters()]);
        setShowResults(false);
      } else {
        setResetMessage("Sul pole õigusi hääletusi tühistada.");
      }

      setTimeout(() => setResetMessage(""), 3000);
    } catch (error) {
      console.error("Reset error:", error);
      setResetMessage("Viga hääletuste tühistamisel.");
      setTimeout(() => setResetMessage(""), 3000);
    }
  }, []);

  const months = votingPeriod
    ? Array.from(
        {
          length:
            differenceInMonths(
              new Date(votingPeriod.endDate),
              new Date(votingPeriod.startDate)
            ) + 1,
        },
        (_, i) => startOfMonth(addMonths(new Date(votingPeriod.startDate), i))
      )
    : [];

  useEffect(() => {
    if (!router.isReady) return;

    const fetchData = async () => {
      try {
        const [datesResponse, votersResponse, headerResponse] =
          await Promise.all([
            fetch("/api/overlapping-dates"),
            fetch("/api/admin/voters"),
            fetch("/api/admin/header"),
          ]);

        if (datesResponse.ok) {
          const dates = await datesResponse.json();
          setDateData(dates);
        }

        if (votersResponse.ok) {
          const votersData = await votersResponse.json();
          setVoters(
            votersData.map((voter: VoterData) => ({
              name: voter.name,
              hasVoted: voter.hasVoted,
              votedAt: voter.votedAt,
            }))
          );
        }

        if (headerResponse.ok) {
          const headerData = await headerResponse.json();
          setHeaderText(headerData.text || "Vali sobivad kuupäevad");
        } else {
          setHeaderText("Vali sobivad kuupäevad");
        }

        const votingPeriodResponse = await fetch("/api/admin/voting-period");
        if (votingPeriodResponse.ok) {
          const periodData = await votingPeriodResponse.json();
          setVotingPeriod({
            startDate: new Date(periodData.startDate),
            endDate: new Date(periodData.endDate),
          });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setHeaderText("Vali sobivad kuupäevad");
      }
    };

    fetchData();

    // Handle reset path if present
    const path = window.location?.pathname || "";
    const resetMatch = path.match(/^\/reset\/(.+)$/);
    if (resetMatch) {
      const resetTarget = resetMatch[1].toLowerCase();
      handleReset(resetTarget);
      router.push("/");
    }
  }, [router.isReady, router, handleReset]);

  const fetchOverlappingDates = async () => {
    try {
      const response = await fetch("/api/overlapping-dates");
      const dates = await response.json();
      setDateData(
        dates.map((item: DateCount) => ({
          date: item.date,
          _count: { date: item._count.date },
          voters: [],
        }))
      );
    } catch (error) {
      console.error("Error fetching overlapping dates:", error);
    }
  };

  const fetchVoters = async () => {
    const votersResponse = await fetch("/api/admin/voters");
    if (votersResponse.ok) {
      const votersData = await votersResponse.json();
      setVoters(
        votersData.map((voter: VoterData) => ({
          name: voter.name,
          hasVoted: voter.hasVoted,
          votedAt: voter.votedAt,
        }))
      );
    }
  };

  const handleDateSelect = (date: Date) => {
    const normalizedDate = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0)
    );

    setSelectedDates((prev) => {
      const exists = prev.some(
        (d) => format(d, "yyyy-MM-dd") === format(normalizedDate, "yyyy-MM-dd")
      );
      if (exists) {
        return prev.filter(
          (d) =>
            format(d, "yyyy-MM-dd") !== format(normalizedDate, "yyyy-MM-dd")
        );
      }
      return [...prev, normalizedDate];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVoter || selectedDates.length === 0) return;

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/submit-votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voterName: selectedVoter,
          dates: selectedDates.map((date) => format(date, "yyyy-MM-dd")),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Hääletamine ebaõnnestus. Palun proovi uuesti."
        );
      }

      router.push("/results");
    } catch (error) {
      console.error("Error submitting dates:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Hääletamine ebaõnnestus. Palun proovi uuesti."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const votedVoters = voters.filter((v) => v.hasVoted);
  const notVotedVoters = voters.filter((v) => !v.hasVoted);

  return (
    <div className="min-h-screen bg-transparent py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {resetMessage && (
          <div
            className={`mb-4 p-4 rounded-lg text-center font-medium ${
              resetMessage.includes("tühistatud")
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {resetMessage}
          </div>
        )}
        <div className="bg-gray-900 rounded-lg shadow-2xl border border-yellow-500/20 p-6 mb-8">
          <h1 className="retro-title text-3xl font-bold text-yellow-400 mb-4 flex items-center gap-3">
            <PlayIcon className="w-8 h-8" />
            HUNTIDE LÄNNILEIDJA
          </h1>
          <div className="flex justify-between items-center mb-8">
            <p className="text-gray-400 font-medium">{headerText}</p>
            <Link
              href="/results"
              className="text-yellow-500 hover:text-yellow-400 transition-colors flex items-center gap-2"
            >
              Vaata tulemusi
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>

          {!showResults ? (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-8">
                {votedVoters.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-bold text-gray-300 flex items-center gap-2">
                      <CheckIcon className="w-5 h-5 text-green-500" />
                      Hääletanud
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {votedVoters.map((voter) => (
                        <div
                          key={voter.name}
                          className="px-4 py-2 rounded-full border border-gray-700 bg-gray-800 text-gray-400 flex items-center gap-2"
                        >
                          {voter.name}
                          <CheckIcon className="w-4 h-4" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-gray-300">
                    Vali oma nimi
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {notVotedVoters.map((voter) => (
                      <button
                        key={voter.name}
                        type="button"
                        onClick={() => setSelectedVoter(voter.name)}
                        className={`
                          relative px-4 py-2 rounded-full border transition-all
                          ${
                            voter.name === selectedVoter
                              ? "ring-2 ring-offset-2 ring-yellow-500 bg-yellow-500/20 text-yellow-300 border-yellow-500/50"
                              : "bg-gray-800/50 text-gray-300 border-gray-700 hover:bg-gray-800 hover:border-gray-600"
                          }
                        `}
                      >
                        {voter.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-900/50 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {selectedVoter && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {months.map((month) => (
                      <Calendar
                        key={month.toString()}
                        month={month}
                        selectedDates={selectedDates}
                        onDateSelect={handleDateSelect}
                      />
                    ))}
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <button
                      type="submit"
                      disabled={isSubmitting || selectedDates.length === 0}
                      className="w-full max-w-md flex items-center justify-center gap-2 bg-yellow-500 text-gray-900 px-4 py-2 rounded-md hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold"
                    >
                      {isSubmitting ? (
                        <UpdateIcon className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <PersonIcon className="w-5 h-5" />
                          Kinnita oma valikud
                        </>
                      )}
                    </button>
                    {selectedDates.length > 0 && (
                      <p className="text-sm text-gray-400">
                        {selectedDates.length} kuupäev
                        {selectedDates.length !== 1 ? "a" : ""} valitud
                      </p>
                    )}
                  </div>
                </>
              )}
            </form>
          ) : (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-300">Tulemused</h2>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-300 mb-4">
                  Vabade aegade ülevaade
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {months.map((month) => (
                    <ResultsCalendar
                      key={month.toString()}
                      month={month}
                      dateCounts={dateData}
                    />
                  ))}
                </div>
                <div className="mt-6 flex items-center justify-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500 opacity-30" />
                    <span className="text-sm text-gray-400">Mõned saavad</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-400 opacity-30" />
                    <span className="text-sm text-gray-400">Paljud saavad</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500 opacity-30" />
                    <span className="text-sm text-gray-400">Enamus saab</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowResults(false)}
                className="text-yellow-500 hover:text-yellow-400 font-medium"
              >
                Lisa uus hääletaja
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
