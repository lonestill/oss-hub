export interface FilterChip {
  key: "language" | "owner" | "stars" | "forks" | "topic" | "isLooking";
  rawToken: string;
  label: string;
  value: string;
}

export interface ParsedSearchQuery {
  raw: string;
  cleanText: string;
  language?: string;
  owner?: string;
  stars?: {
    operator: ">" | ">=" | "<" | "<=" | "=";
    value: number;
  };
  forks?: {
    operator: ">" | ">=" | "<" | "<=" | "=";
    value: number;
  };
  topic?: string;
  isLooking?: boolean;
  filters: FilterChip[];
}

export function parseSearchQuery(input: string): ParsedSearchQuery {
  if (!input || !input.trim()) {
    return { raw: "", cleanText: "", filters: [] };
  }

  let text = input.trim();
  const filters: FilterChip[] = [];
  let language: string | undefined;
  let owner: string | undefined;
  let stars: ParsedSearchQuery["stars"] | undefined;
  let forks: ParsedSearchQuery["forks"] | undefined;
  let topic: string | undefined;
  let isLooking: boolean | undefined;

  // 1. Language: @language:rust, language:rust, @lang:rust, lang:rust, language:"C++"
  text = text.replace(/(?:@?lang(?:uage)?):(?:"([^"]+)"|(\S+))/gi, (match, qVal, rawVal) => {
    const val = (qVal || rawVal || "").trim();
    if (val) {
      language = val;
      filters.push({ key: "language", rawToken: match, label: "Язык", value: val });
    }
    return " ";
  });

  // 2. Owner / User: @owner:xxx, owner:xxx, @user:xxx, user:xxx, @author:xxx
  text = text.replace(/(?:@?(?:owner|user|author)):(?:"([^"]+)"|(\S+))/gi, (match, qVal, rawVal) => {
    const val = (qVal || rawVal || "").trim();
    if (val) {
      owner = val;
      filters.push({ key: "owner", rawToken: match, label: "Владелец", value: val });
    }
    return " ";
  });

  // 3. Stars: stars:>10, stars:>=5, stars:<100, stars:10, @stars:>10
  text = text.replace(/(?:@?stars):((?:>=|<=|>|<|=)?\d+)/gi, (match, expr) => {
    const numMatch = expr.match(/^(>=|<=|>|<|=)?(\d+)$/);
    if (numMatch) {
      const op = (numMatch[1] as ">" | ">=" | "<" | "<=" | "=") || ">=";
      const num = parseInt(numMatch[2], 10);
      stars = { operator: op, value: num };
      filters.push({ key: "stars", rawToken: match, label: "Звёзды", value: `${op} ${num}` });
    }
    return " ";
  });

  // 4. Forks: forks:>5, forks:10, @forks:>=2
  text = text.replace(/(?:@?forks):((?:>=|<=|>|<|=)?\d+)/gi, (match, expr) => {
    const numMatch = expr.match(/^(>=|<=|>|<|=)?(\d+)$/);
    if (numMatch) {
      const op = (numMatch[1] as ">" | ">=" | "<" | "<=" | "=") || ">=";
      const num = parseInt(numMatch[2], 10);
      forks = { operator: op, value: num };
      filters.push({ key: "forks", rawToken: match, label: "Форки", value: `${op} ${num}` });
    }
    return " ";
  });

  // 5. Topic / Tag: topic:xxx, tag:xxx, @topic:xxx
  text = text.replace(/(?:@?(?:topic|tag)):(?:"([^"]+)"|(\S+))/gi, (match, qVal, rawVal) => {
    const val = (qVal || rawVal || "").trim();
    if (val) {
      topic = val;
      filters.push({ key: "topic", rawToken: match, label: "Тег", value: val });
    }
    return " ";
  });

  // 6. Status / Looking: is:looking, status:looking, @looking, is:seeking
  text = text.replace(/(?:is:looking|status:looking|@looking|is:seeking)/gi, (match) => {
    isLooking = true;
    filters.push({ key: "isLooking", rawToken: match, label: "Статус", value: "Ищут участников" });
    return " ";
  });

  const cleanText = text.replace(/\s+/g, " ").trim();

  return {
    raw: input,
    cleanText,
    language,
    owner,
    stars,
    forks,
    topic,
    isLooking,
    filters,
  };
}

export function removeFilterToken(input: string, key: FilterChip["key"]): string {
  if (!input) return "";
  let text = input;
  switch (key) {
    case "language":
      text = text.replace(/(?:@?lang(?:uage)?):(?:"[^"]+"|(?:\S+))/gi, "");
      break;
    case "owner":
      text = text.replace(/(?:@?(?:owner|user|author)):(?:"[^"]+"|(?:\S+))/gi, "");
      break;
    case "stars":
      text = text.replace(/(?:@?stars):(?:(?:>=|<=|>|<|=)?\d+)/gi, "");
      break;
    case "forks":
      text = text.replace(/(?:@?forks):(?:(?:>=|<=|>|<|=)?\d+)/gi, "");
      break;
    case "topic":
      text = text.replace(/(?:@?(?:topic|tag)):(?:"[^"]+"|(?:\S+))/gi, "");
      break;
    case "isLooking":
      text = text.replace(/(?:is:looking|status:looking|@looking|is:seeking)/gi, "");
      break;
  }
  return text.replace(/\s+/g, " ").trim();
}

export function appendOrReplaceFilterToken(input: string, token: string): string {
  let res = input || "";
  const t = token.toLowerCase();
  if (t.startsWith("@language:") || t.startsWith("language:") || t.startsWith("@lang:") || t.startsWith("lang:")) {
    res = removeFilterToken(res, "language");
  } else if (t.startsWith("@owner:") || t.startsWith("owner:") || t.startsWith("@user:") || t.startsWith("user:")) {
    res = removeFilterToken(res, "owner");
  } else if (t.startsWith("@stars:") || t.startsWith("stars:")) {
    res = removeFilterToken(res, "stars");
  } else if (t.startsWith("@forks:") || t.startsWith("forks:")) {
    res = removeFilterToken(res, "forks");
  } else if (t.startsWith("is:looking") || t.startsWith("status:looking") || t.startsWith("@looking")) {
    res = removeFilterToken(res, "isLooking");
  }
  return (res ? `${res.trim()} ${token}` : token).replace(/\s+/g, " ").trim();
}

