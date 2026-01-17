interface ProgressIndicatorProps {
  completedSteps: string[];
  currentStepIndex: number;
  totalSteps: string[];
}

export default function ProgressIndicator({
  completedSteps,
  currentStepIndex,
  totalSteps,
}: ProgressIndicatorProps) {
  const progress = ((completedSteps.length / totalSteps.length) * 100).toFixed(0);
  const currentStep = totalSteps[currentStepIndex];

  return (
    <div className="bg-slate-800 rounded-lg p-4 mb-6">
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-white">Progress</h3>
          <span className="text-sm text-zinc-400">{progress}% Complete</span>
        </div>
      </div>

      <div className="space-y-3">
        {totalSteps.map((step, index) => {
          const isCompleted = completedSteps.includes(step);
          const isCurrent = index === currentStepIndex;

          return (
            <div
              key={step}
              className={`flex items-center gap-4 p-3 rounded-lg transition-all ${
                isCompleted
                  ? "bg-green-600 text-white"
                  : isCurrent
                    ? "bg-blue-600 text-white"
                    : "bg-slate-700 text-zinc-400"
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                isCompleted
                  ? "bg-white text-green-600"
                  : isCurrent
                    ? "bg-white text-blue-600"
                    : "bg-slate-600 text-zinc-400"
              }`}>
                {isCompleted && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 6l2 2-2-6-2 0 12l6-2-2 2 8 9m-8.5 5 2a4 4 4 5.5.468 0 0 .01-.009-.009 5.5 0 5.458 4 4 2 2.5 5.458 0 0 .01-.009-.009 5.5 0 5.458 4 4 2 2.5 5.458 0 0 .01-.009-.009 5.5 0 5.458 4 4 2 2.5 5.458 0 0 .01-.009-.009 5.5 0 5.458 4 4 2 2.5 5.458 0 0 .01-.009-.009 5.5 0 5.458 4 4 2 2.5 5.458 0 0 .01-.009-.009 5.5 0 5.458 4 4 2 2.5 5.458 0 0 .01-.009-.009 5.5 0 5.458 4 4 2 2.5 5.458 0 0 .01-.009-.009 5.5 0 5.458 4 4 2 2.5 5.458 0 0 .01-.009-.009 5.5 0 5.458 4 4 2 2.5 5.458 0 0 .01-.009-.009 5.5 0 5.458 4 4 2 2.5 5.458 0 0 .01-.009-.009 5.5 0 5.458 4 4 2 2.5 5.458 0 0 .01-.009-.009 5.5 0 5.458 4 4 2 2.5 5.458 0 0 .01-.009-.009 5.5 0 5.458 4 4 2 2.5 5.458 0 0 .01-.009-.009 5.5 0 5.458 4 4 2 2.5 5.458 0 0 .01-.009-.009 5.5 0 5.458 4 4 2 2.5 5.458 0 0 .01-.009-.009 5.5 0 5.458 4 4 2 2.5 5.458 0 0 .01-.009-.009 5.5 0 5.458 4 4 2 2.5 5.458 0 0 .01-.009-.009 5.5 0 5.458 4 4 2 2.5 5.458 0 0 .01-.009-.009 5.5 0 5.458 4 4 2 2.5 5.458 0 0 .01-.009-.009 5.5 0 5.458 4 4 2 2.5 5.458 0 0 .01-.009-.009 5.5 0 5.458 4 4 2 2.5 5.458 0 0 .01-.009-.009 5.5 0 5.458 4 4 2 2.5 5.458 0 0 .01-.009-.009 5.5 0 5.458 4 4 2 2.5 5.458 0 0 .01-.009-.009 5.5 0 5.458 4 4 2 2.5 5.458 0 0 .01-.009-.009 5.5 0 5.458 4 4 2 2.5 5.458 0 0 .01-.009-.009 5.5 0 5.458 4 4 2 2.5 5.458 0 0 .01-.009-.009 5.5 0 5.458 4 4 2 2.5 5.458 0 0 .01-.009-.009 5.5 0 5.458 4 4 2 2.5 5.458 0 0 .01-.009-.009 5.5 0 5.458 4 4 2 2.5 5.458 0 0 .01-.009-.009 5.5 0 5.458 4 4 2 2.5 5.458 0 0 .01-.009-.009 5.5 0 5.458 4 4 2 2.5 5.458 0 0 .01-.009-.009 5.5 0 5.458 4 4 2 2.5 5.458 0 0 .01-.009-.009 5.5 0 5.458 4 4 2 2.5 5.458 0 0 .01-.009-.009 5.5 0 5.458 4 4 2 2.5 5.458 0 0 .01-.009-.009 5.5 0 5.458 4 4 2 2.5 5.458 0 0 .01-.009-.009 5.5 0 5.458 4 4 2 2.5 5.458 0 0 .01-.009-.009 5.5 0 5.458 4 4 2 2.5 5.458 0 0 .01-.009-.009 5.5 0 5.458 4 4 2 2.5 5.458 0 0 .01-.009-.009 5.5 0 5.458 4 4 2 2.5 5.458 0 0 .01-.009-.009 5.5 0 5.458 4 4 2 2.5 5.458 0 0 .01-.009-.009 5.5 0 5.458 4 4 2 2.5 5.458 0 0 .01-.009-.009 5.5 0 5.458 4 4 2 2.5 5.458 0 0 .01-.009-.009 5.5 0 5. Proposal Generator 0 5.458 4 4 2 2.5 5.458 0 0 .01-.009-.009 5.5 0 5.458 4 4 2 2.5 5.458 0 0 .01-.009-.009 5.5 0 5.458 4 4 2 2.5 5.458 0 0 .01-.009-.009 5.5 0 5.458 4 4 2 2.5 5.458 0 0 .01-.009-.009 5.5 0 5.458 4 4 2 2.5 5.458 0 0 .01-.009-.009 5.5 0 5.458 4 4 2 2.5 5.458 0 0 .01-.009-.009 5.5 0 5.458 4 4 2 2.5 5.458 0 0 .01-.009-.009 5.5 0 5.458 4 4 2 2.5 5.458 0 0 .01-.009-.009 5.5 0 5.458 4 4 2 2.5 5.458 0 0 .01-.009-.009 5.5 0 5.458 4 4 2 2. 5.458 0  requirements
                <span className="text-zinc-400 font-semibold">{index + 1}</span>
                <span className="text-zinc-400">: {step}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 text-center text-sm text-zinc-400">
        {completedSteps.length} of {totalSteps.length} steps completed
      </div>
    </div>
  );
}
