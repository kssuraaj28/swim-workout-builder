import { Header, ENABLE_SET_BUILDER, type AppMode } from './Header';

interface Props {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

export function InfoPage({ mode, onModeChange }: Props) {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header mode={mode} onModeChange={onModeChange} />

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">How to use</h2>
          <p className="text-sm text-gray-700">
            Swim Workout Builder has two independent tools. Use them together or
            separately.
          </p>
        </section>

        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-2">Build Workout</h3>
          <p className="text-sm text-gray-700 mb-2">
            Compose a full pool workout from sets, preview it, and copy a Garmin
            Connect JSON payload to your clipboard.
          </p>
          <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
            <li>Workouts are identified by name + creation date — duplicates only warn when both match.</li>
            <li>Save stores the workout in the sidebar library; load by clicking an entry.</li>
            <li>Insert from Library drops a copy of a saved set template into the workout.</li>
          </ul>
        </section>

        {ENABLE_SET_BUILDER && (
          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Build Set</h3>
            <p className="text-sm text-gray-700 mb-2">
              Author reusable set templates (e.g. "8×100 IM on 1:45") that can be
              inserted into any workout.
            </p>
            <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
              <li>Mark <code>params</code> on a template to expose stroke / distance / iterations as knobs at insert time.</li>
              <li>Templates are stored in their own library and persist across sessions.</li>
              <li>Inserted sets are <em>copies</em> — editing the template later does not retro-update workouts.</li>
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
