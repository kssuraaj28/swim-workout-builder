import type { ReactNode } from 'react';
import { Header, ENABLE_SET_BUILDER, type AppMode } from './Header';

interface Props {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

export function InfoPage({ mode, onModeChange }: Props) {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header mode={mode} onModeChange={onModeChange} />

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <Card>
          <h2 className="text-lg font-bold text-gray-900 mb-2">How to use</h2>
          <p className="text-sm text-gray-700">
            Use this tool to write your swimming workouts!
          </p>
        </Card>

        <Card>
          <h3 className="text-base font-semibold text-gray-900 mb-2">Build Workout</h3>
          <p className="text-sm text-gray-700 mb-3">
            Compose a full pool workout from sets, preview it, and copy a Garmin
            Connect JSON payload to your clipboard.
          </p>
          <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
            <li>Workouts are identified by name + creation date — duplicates only warn when both match.</li>
            <li>Save stores the workout in the sidebar library; load by clicking an entry.</li>
            {ENABLE_SET_BUILDER && <li>Insert from Library drops a copy of a saved set template into the workout.</li>}
          </ul>
        </Card>

        <Card>
          <h3 className="text-base font-semibold text-gray-900 mb-2">Export to Garmin Connect</h3>
          <p className="text-sm text-gray-700">
            To upload the exported JSON to Garmin Connect, use either{' '}
            <ExternalLink href="https://chromewebstore.google.com/detail/garmin-connect-workouts-m/odgdfpclpfmmemajpmgfipfdfmjgihac?hl=en">
              this Chrome extension
            </ExternalLink>{' '}
            or{' '}
            <ExternalLink href="https://github.com/kssuraaj28/garmin-connect-upload">
              this Python script
            </ExternalLink>.
          </p>
        </Card>

        {ENABLE_SET_BUILDER && (
          <Card>
            <h3 className="text-base font-semibold text-gray-900 mb-2">Build Set</h3>
            <p className="text-sm text-gray-700 mb-3">
              Author reusable set templates (e.g. "8×100 IM on 1:45") that can be
              inserted into any workout.
            </p>
            <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
              <li>Mark <code>params</code> on a template to expose stroke / distance / iterations as knobs at insert time.</li>
              <li>Templates are stored in their own library and persist across sessions.</li>
              <li>Inserted sets are <em>copies</em> — editing the template later does not retro-update workouts.</li>
            </ul>
          </Card>
        )}

        <Card>
          <h3 className="text-base font-semibold text-gray-900 mb-2">Open source</h3>
          <p className="text-sm text-gray-700">
            This app is open source. Find the code{' '}
            <ExternalLink href="https://github.com/kssuraaj28/swim-workout-builder">
              here
            </ExternalLink>.
          </p>
        </Card>
      </main>
    </div>
  );
}

function Card({ children }: { children: ReactNode }) {
  return (
    <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {children}
    </section>
  );
}

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 hover:text-blue-800 underline"
    >
      {children}
    </a>
  );
}
