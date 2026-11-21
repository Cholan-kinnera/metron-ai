import { afterEach, describe, expect, it, vi } from 'vitest';

const generateContent = vi.fn();
vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = { generateContent };
  },
}));

const { analyzeIssue } = await import('./gemini.js');
const { classifyByRules } = await import('./classifier.js');

const input = {
  title: 'Streetlight sparking',
  description: 'Live wire hanging from a sparking streetlight pole.',
  address: 'RS Puram',
};

afterEach(() => {
  generateContent.mockReset();
  delete process.env.GEMINI_API_KEY;
});

describe('classifyByRules', () => {
  it.each([
    ['Garbage bin overflowing on the street', 'Garbage & Sanitation', 'Sanitation & Solid Waste Management'],
    ['Pothole on the road near junction', 'Roads & Potholes', 'Public Works Department'],
    ['Water pipe leak in colony', 'Water Supply & Leakage', 'Water Supply & Sewerage Board'],
  ])('routes "%s"', (text, category, department) => {
    expect(classifyByRules(text)).toMatchObject({ category, department, source: 'rules' });
  });

  it('escalates life-threatening hazards to Critical', () => {
    expect(classifyByRules(input.description).priority).toBe('Critical');
  });

  it('keeps the citizen hint when nothing matches', () => {
    expect(classifyByRules('something odd', 'Parks & Public Spaces')).toMatchObject({
      category: 'Parks & Public Spaces',
      priority: 'Low',
    });
  });
});

describe('analyzeIssue', () => {
  it('uses rules without an API key', async () => {
    expect((await analyzeIssue(input)).source).toBe('rules');
    expect(generateContent).not.toHaveBeenCalled();
  });

  it('returns validated Gemini output and sends the photo inline', async () => {
    process.env.GEMINI_API_KEY = 'test';
    generateContent.mockResolvedValue({
      text: JSON.stringify({
        category: 'Streetlights & Electricity',
        priority: 'Critical',
        department: 'Electricity Board',
        summary: 'Exposed live wire at streetlight.',
        reasoning: 'Electrocution risk to pedestrians.',
        confidence: 0.95,
      }),
    });
    const result = await analyzeIssue({ ...input, image: 'data:image/jpeg;base64,AAAA' });
    expect(result).toMatchObject({
      source: 'gemini',
      model: 'gemini-3.5-flash-lite',
      department: 'Electricity Board',
      confidence: 0.95,
    });
    const call = generateContent.mock.calls[0][0];
    expect(call.config.responseMimeType).toBe('application/json');
    expect(call.contents[0].parts[1].inlineData).toEqual({ mimeType: 'image/jpeg', data: 'AAAA' });
  });

  it('cascades to the next model when the first is overloaded', async () => {
    process.env.GEMINI_API_KEY = 'test';
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    generateContent.mockRejectedValueOnce(new Error('503 high demand')).mockResolvedValueOnce({
      text: JSON.stringify({
        category: 'Public Safety',
        priority: 'High',
        department: 'Police & Public Safety',
        summary: 's',
        reasoning: 'r',
        confidence: 0.7,
      }),
    });
    const result = await analyzeIssue({
      ...input,
      description: 'Crowd blocking the road near the bus stand.',
    });
    expect(generateContent).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({ source: 'gemini', model: 'gemini-3.1-flash-lite' });
  });

  it('falls back to rules when Gemini returns invalid data', async () => {
    process.env.GEMINI_API_KEY = 'test';
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    generateContent.mockResolvedValue({ text: '{"category":"Aliens"}' });
    expect((await analyzeIssue(input)).source).toBe('rules');
    generateContent.mockRejectedValue(new Error('quota'));
    expect((await analyzeIssue(input)).source).toBe('rules');
    expect(generateContent).toHaveBeenCalledTimes(4);
  });
});
