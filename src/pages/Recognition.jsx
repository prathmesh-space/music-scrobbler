import { Mic, Music, Upload } from 'lucide-react';

export default function Recognition() {
  return (
    <div className="min-h-screen bg-gray-900 px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="rounded-xl border border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900 p-8">
          <h1 className="flex items-center gap-2 text-3xl font-bold text-white">
            <Mic className="h-8 w-8 text-purple-300" />
            Song recognition
          </h1>
          <p className="mt-2 text-gray-300">
            Identify songs from short audio clips. This page is ready for recognition features.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-lg border border-gray-700 bg-gray-800 p-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <Upload className="h-5 w-5 text-purple-300" />
              Upload a clip
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              Add support for uploading a short clip and running recognition with your preferred API.
            </p>
          </article>

          <article className="rounded-lg border border-gray-700 bg-gray-800 p-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <Music className="h-5 w-5 text-purple-300" />
              View matches
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              Display matched tracks, artists, confidence, and quick links once recognition is connected.
            </p>
          </article>
        </section>
      </div>
    </div>
  );
}
