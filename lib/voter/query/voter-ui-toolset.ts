import { executeSelectsTool } from "@/lib/voter/query/execute-selects";
import { z } from "zod";
import { districtLookupTool } from "@/lib/tools/district-lookup-tool";

export const getVoterAiChatUiToolset = () => {
	return {
		executeSelectsTool,
		districtLookupTool,
		errorMessageTool: {
				description: "A utility tool to process and handle error messages returned by any other tool.",
				parameters: z.object({
					errorMessage: z.string().describe("The detailed error message that was generated during the execution of another tool."),
				}).describe("An object containing the necessary parameters for handling the error message, specifically the error message string that needs to be logged or processed."),
				execute: async ({ errorMessage }: { errorMessage: string }) => (errorMessage),
		},
	};
};
