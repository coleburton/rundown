import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Database } from '@/types/supabase';

type RootStackParamList = {
  Dashboard: undefined;
  ActivityHistory: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'ActivityHistory'>;
type RunLog = Database['public']['Tables']['run_logs']['Row'];
type Message = Database['public']['Tables']['messages']['Row'];

interface WeekSummary {
  startDate: Date;
  endDate: Date;
  runs: RunLog[];
  messages: Message[];
  goalMet: boolean;
}

export function ActivityHistoryScreen({ navigation }: Props) {
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [weeks, setWeeks] = useState<WeekSummary[]>([]);

  const fetchHistory = async () => {
    try {
      setLoading(true);

      // Get start of 4 weeks ago
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - startDate.getDay() + (startDate.getDay() === 0 ? -6 : 1) - 21);
      startDate.setHours(0, 0, 0, 0);

      // Fetch runs
      const { data: runs, error: runsError } = await supabase
        .from('run_logs')
        .select('*')
        .eq('user_id', user!.id)
        .gte('date', startDate.toISOString())
        .order('date', { ascending: false });

      if (runsError) throw runsError;

      // Fetch messages
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', user!.id)
        .gte('sent_at', startDate.toISOString())
        .order('sent_at', { ascending: false });

      if (messagesError) throw messagesError;

      // Group by week
      const weekSummaries: WeekSummary[] = [];
      for (let i = 0; i < 4; i++) {
        const weekStart = new Date(startDate);
        weekStart.setDate(weekStart.getDate() + (i * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        const weekRuns = runs.filter(
          (run) => {
            const runDate = new Date(run.date);
            return runDate >= weekStart && runDate <= weekEnd;
          }
        );

        const weekMessages = messages.filter(
          (msg) => {
            const msgDate = new Date(msg.sent_at);
            return msgDate >= weekStart && msgDate <= weekEnd;
          }
        );

        weekSummaries.push({
          startDate: weekStart,
          endDate: weekEnd,
          runs: weekRuns,
          messages: weekMessages,
          goalMet: weekRuns.length >= (user?.goal_per_week ?? 3),
        });
      }

      setWeeks(weekSummaries);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const formatDate = (date: Date) => {
    // Add validation to ensure date is valid
    if (!date || isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDistance = (meters: number) => {
    const miles = meters / 1609.34;
    return `${miles.toFixed(1)} miles`;
  };

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-gray-900"
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetchHistory} />
      }
    >
      <View className="p-6">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-8">
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-900 dark:text-white">
              Activity History
            </Text>
            <Text className="text-gray-500 dark:text-gray-400">
              Last 4 weeks
            </Text>
          </View>
          <Button
            onPress={() => navigation.goBack()}
            variant="ghost"
            className="rounded-full"
            title="Back"
          />
        </View>

        {/* Weeks */}
        <View className="space-y-8">
          {weeks.map((week, index) => (
            <View key={week.startDate.toISOString()} className="space-y-4">
              {/* Week Header */}
              <View className="flex-row items-center justify-between">
                <Text className="font-semibold text-gray-900 dark:text-white">
                  {formatDate(week.startDate)} - {formatDate(week.endDate)}
                </Text>
                <View
                  className={`px-2 py-1 rounded-full ${
                    week.goalMet
                      ? 'bg-lime-100 dark:bg-lime-900/20'
                      : 'bg-orange-100 dark:bg-orange-900/20'
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      week.goalMet
                        ? 'text-lime-700 dark:text-lime-300'
                        : 'text-orange-700 dark:text-orange-300'
                    }`}
                  >
                    {week.goalMet ? 'Goal Met' : 'Goal Missed'}
                  </Text>
                </View>
              </View>

              {/* Runs */}
              <View className="space-y-2">
                {week.runs.length === 0 ? (
                  <Text className="text-gray-500 dark:text-gray-400 text-center py-2">
                    No runs this week
                  </Text>
                ) : (
                  week.runs.map((run) => (
                    <View
                      key={run.id}
                      className="flex-row items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl p-4"
                    >
                      <View className="flex-row items-center space-x-3">
                        <View className="w-2 h-2 bg-lime-500 rounded-full" />
                        <View>
                          <Text className="font-medium text-gray-900 dark:text-white">
                            {(() => {
                              const runDate = new Date(run.date);
                              if (isNaN(runDate.getTime())) {
                                return 'Invalid Date';
                              }
                              return runDate.toLocaleDateString('en-US', {
                                weekday: 'short',
                              }) + ' Run';
                            })()}
                          </Text>
                          <Text className="text-sm text-gray-500">
                            {formatDistance(run.distance)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </View>

              {/* Messages */}
              {week.messages.length > 0 && (
                <View className="space-y-2">
                  <Text className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Accountability Messages
                  </Text>
                  {week.messages.map((message) => (
                    <View
                      key={message.id}
                      className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4"
                    >
                      <Text className="text-gray-900 dark:text-white">
                        {message.message_text}
                      </Text>
                      <Text className="text-xs text-gray-500 mt-1">
                        {(() => {
                          const messageDate = new Date(message.sent_at);
                          if (isNaN(messageDate.getTime())) {
                            return 'Invalid Date';
                          }
                          return messageDate.toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          });
                        })()}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
} 