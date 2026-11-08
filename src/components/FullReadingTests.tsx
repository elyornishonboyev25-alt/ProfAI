import UiText from '@/components/common/UiText'
﻿import { fullReadingTests } from "../data/fullReadingTest";
import "../styles/globals.css";

const FullReadingTests = () => {
  return (
    <div className="reading-tests-container">
      <h1 className="text-center text-3xl font-bold mb-6 text-white">
        <UiText text={"IELTS Academic Reading Tests"} />
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {fullReadingTests.map((test) => (
          <div
            key={test.id}
            className="test-card p-6 bg-gray-800 text-white rounded-lg shadow-lg hover:shadow-xl transition-shadow relative"
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex space-x-2">
                {test.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-gray-700 text-xs px-2 py-1 rounded-full uppercase"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <span className="text-yellow-400 font-bold">
                в­ђ {test.rating}
              </span>
            </div>
            <h2 className="text-2xl font-semibold mb-2">{test.title}</h2>
            <p className="text-sm text-gray-400 mb-2">{test.description}</p>
            <div className="flex justify-between text-sm text-gray-500">
              <span>вЏ± {test.duration}</span>
              <span>рџ“‹ {test.questions} <UiText text={"Questions"} /></span>
              <span>рџ“Љ {test.level}</span>
            </div>
            <button className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              <UiText text="Start Test" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FullReadingTests;

