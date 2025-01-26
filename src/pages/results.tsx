import { useEffect, useState } from "react";
import { ResultsCalendar } from "@/components/ResultsCalendar";
import { addMonths, startOfMonth } from "date-fns";
import Link from "next/link";
import { ArrowLeftIcon } from "@radix-ui/react-icons";

export default function Results() {
  const [dateData, setDateData] = useState<
    { date: string; _count: { date: number }; voters: string[] }[]
  >([]);
  const [voters, setVoters] = useState<
    { name: string; hasVoted: boolean; votedAt: string | null }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const months = Array.from({ length: 6 }, (_, i) =>
    startOfMonth(addMonths(new Date(), i))
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const datesResponse = await fetch("/api/overlapping-dates");
        const votersResponse = await fetch("/api/admin/voters");

        if (!datesResponse.ok) {
          const errorText = await datesResponse.text();
          console.error("Dates API error:", {
            status: datesResponse.status,
            statusText: datesResponse.statusText,
            body: errorText,
          });
          throw new Error(
            `Dates API failed: ${datesResponse.status} ${datesResponse.statusText}`
          );
        }

        if (!votersResponse.ok) {
          const errorText = await votersResponse.text();
          console.error("Voters API error:", {
            status: votersResponse.status,
            statusText: votersResponse.statusText,
            body: errorText,
          });
          throw new Error(
            `Voters API failed: ${votersResponse.status} ${votersResponse.statusText}`
          );
        }

        const [datesData, votersData] = await Promise.all([
          datesResponse.json(),
          votersResponse.json(),
        ]);

        setDateData(datesData);
        setVoters(votersData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setError(
          typeof error === "string"
            ? error
            : error instanceof Error
            ? error.message
            : "Failed to load voting results. Please try again later."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-transparent py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-gray-900 rounded-lg shadow-2xl border border-yellow-500/20 p-6">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-yellow-400">
              Hääletustulemused
            </h1>
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-400 hover:text-gray-300"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Tagasi hääletama
            </Link>
          </div>

          {isLoading && (
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400" />
            </div>
          )}

          {error && (
            <div className="text-red-400 text-center p-4 bg-red-900/20 rounded-lg">
              {error}
            </div>
          )}

          {!isLoading && !error && (
            <>
              {voters.length > 0 && (
                <div className="mb-8 space-y-4 bg-gray-800/50 rounded-lg border border-gray-700 p-4">
                  {voters.filter((v) => v.hasVoted).length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-green-400">
                        Hääletanud:
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {voters
                          .filter((v) => v.hasVoted)
                          .map((voter) => (
                            <span
                              key={voter.name}
                              className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400 border border-green-500/20"
                            >
                              {voter.name}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}

                  {voters.filter((v) => !v.hasVoted).length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-yellow-400">
                        Pole veel hääletanud:
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {voters
                          .filter((v) => !v.hasVoted)
                          .map((voter) => (
                            <span
                              key={voter.name}
                              className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/20"
                            >
                              {voter.name}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {months.map((month) => (
                  <ResultsCalendar
                    key={month.toString()}
                    month={month}
                    dateCounts={dateData}
                    showOnTouch={true}
                  />
                ))}
              </div>

              <div className="mt-8 flex items-center justify-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-300/50" />
                  <span className="text-sm text-gray-400">Vähe</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-400/50" />
                  <span className="text-sm text-gray-400">Mõned</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500/50" />
                  <span className="text-sm text-gray-400">Enim</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
