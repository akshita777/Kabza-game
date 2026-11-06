import React from 'react';
import KabzaApp from '@/components/kabza/KabzaApp';

interface JoinRoomPageProps {
  params: Promise<{ code: string }>;
}

export default async function JoinRoomPage({ params }: JoinRoomPageProps) {
  const resolvedParams = await params;
  const roomCode = decodeURIComponent(resolvedParams.code || '').toUpperCase();

  return <KabzaApp initialJoinCode={roomCode} />;
}
