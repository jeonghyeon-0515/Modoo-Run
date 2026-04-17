import type { ImportantRaceChange } from './change-events';

export type PersistRaceChangeEventInput = {
  syncRunId: string;
  raceId: string;
  sourceSite: string;
  sourceRaceId: string;
  raceTitle: string;
  changeKey: string;
  importantChange: ImportantRaceChange | null;
};

export type PersistRaceChangeEventDeps = {
  readExistingEvent: (input: { raceId: string; changeKey: string }) => Promise<{ id: string } | null>;
  createEvent: (input: {
    raceId: string;
    syncRunId: string;
    sourceSite: string;
    sourceRaceId: string;
    changeKey: string;
    importantChange: ImportantRaceChange;
  }) => Promise<{ id: string } | null>;
  deliver: (input: {
    eventId: string;
    raceId: string;
    sourceRaceId: string;
    raceTitle: string;
    changedFields: ImportantRaceChange['changedFields'];
    summaryItems: ImportantRaceChange['summaryItems'];
    changeKey: string;
  }) => Promise<void>;
};

export async function persistRaceChangeEvent(input: PersistRaceChangeEventInput, deps: PersistRaceChangeEventDeps) {
  if (!input.importantChange) {
    return null;
  }

  let eventId = (await deps.readExistingEvent({ raceId: input.raceId, changeKey: input.changeKey }))?.id;
  let created = false;

  if (!eventId) {
    const createdEvent = await deps.createEvent({
      raceId: input.raceId,
      syncRunId: input.syncRunId,
      sourceSite: input.sourceSite,
      sourceRaceId: input.sourceRaceId,
      changeKey: input.changeKey,
      importantChange: input.importantChange,
    });

    if (!createdEvent) {
      const rereadEvent = await deps.readExistingEvent({ raceId: input.raceId, changeKey: input.changeKey });
      if (!rereadEvent) {
        throw new Error('대회 변경 이벤트 재조회 실패: unknown');
      }
      eventId = rereadEvent.id;
    } else {
      eventId = createdEvent.id;
      created = true;
    }
  }

  if (!eventId) {
    throw new Error('대회 변경 이벤트 ID를 확인하지 못했습니다.');
  }

  await deps.deliver({
    eventId,
    raceId: input.raceId,
    sourceRaceId: input.sourceRaceId,
    raceTitle: input.raceTitle,
    changedFields: input.importantChange.changedFields,
    summaryItems: input.importantChange.summaryItems,
    changeKey: input.changeKey,
  });

  return {
    eventId,
    created,
  };
}
