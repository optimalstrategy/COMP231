import { ITicket } from "server/models/tickets/ticket.types";

/// The interface that the KeyBERT parameters must follow.
export interface IBertSettings {
    /// The number of keywords to extract. Defaults to 5.
    n?: number,
    /// A tuple specifying the number of words that an extract keyword must have.
    /// Defaults to (3, 3), meaning 3 words minimum and 3 words maximum per extracted keyword.
    keyphrase_ngram_range?: [number, number];
    /// Whether to use MaximalMarginalRelevance (MMR) for keyword selection. Defaults to true.
    use_mmr?: boolean,
    /// The diversity of the extracted keyword as a number between 0 and 1.0. Only works if `use_mmr` is true.
    /// Defaults to 0.7.
    diversity?: number,
    /// The words to exclude from the document before predicting keywords.
    stop_words: string[] | "english";
}

/// The interface that the Summa parameters must follow.
export interface SummaSettings {
    /// The maximum number of keywords to extract.
    words?: 5,
    /// How many keywords to extract as a ratio relative to the text size. Ignored if the `words` settings is used.
    ratio?: 0.2,
    /// Whether to include the confidence scores in the output. Defaults to true.
    scores?: boolean,
}


/// The interface that the Yake! parameters must follow.
export interface YakeSettings {
    /// Maximum number of words in a single keyword. Defaults to 3.
    n: number,
    /// The number of keyphrases to extract. Defaults to 5.
    top: number,
    /// Deduplication threshold. Keywords that are this or more similar will be filtered out. Defaults to 0.9.
    dedupLim: number,
    /// Deduplication function used to compare keywords. Defaults to `seqm`.
    dedupFunc: "seqm" | "leve" | "jaro",
    /// The size of the window used to look for keywords. Defaults to 2.
    windowsSize: number
}


export interface IKeywordSettings {
    /// Specifies the keyword extraction algorithm.
    ///
    /// "bert" - An neural network made with BERT embeddings. Tends to be slower.
    /// "summa" - A graph-based keyword extractor. 
    /// "yake" - A frequency-based keyword extractor. Doesn't utilize any context or analyze the semantics of the text. Runs fast.
    method: "bert" | "summa" | "yake";
    parameters?: IBertSettings | SummaSettings | YakeSettings;
}

/// The settings to use while processing the tickets.
export interface ISubmissionSettings {
    /// THe settings to use for keyword prediction.
    keywords?: IKeywordSettings
}

/// The interface of a ticket submission request.
export interface ITicketSubmission {
    /// The body of the ticket to process. Must be present.
    description: string;
    /// The headline or general scope of the ticket. May be empty.
    headline?: string;
    /// The user who submitted the ticket.
    user?: string;
    /// The settings to use while processing the tickets.
    settings?: ISubmissionSettings
}

export interface ITicketUpdate {
    /// The ticket fields to update.
    ticket: ITicket,
    /// Whether the ticket should be processed again.
    requiresProcessing?: boolean,
    /// The settings to use to for processing.
    settings?: ISubmissionSettings
}