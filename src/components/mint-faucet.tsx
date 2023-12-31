"use client";
import React from "react";
// chadcn
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
// wagmi
import {
    useContractWrite,
    useContractReads,
    useAccount,
    useWaitForTransaction,
} from "wagmi";
// web3modal
import { useWeb3Modal } from "@web3modal/react";
// utils
import tokens from "../utils/tokens/mangrove-tokens.json";
import erc20_abi from "../utils/tokens/abi.json";
// viewm
import { formatUnits, parseUnits } from "viem";
// notistack
import { enqueueSnackbar } from "notistack";
// lucide-react
import { Loader2 } from "lucide-react";

const MintFaucet = () => {
    const [token, SetToken] = React.useState<string>("");
    const [amount, setAmount] = React.useState<string>("0");
    const [loading, setLoading] = React.useState<boolean>(false);

    const { open } = useWeb3Modal();
    const { isConnected } = useAccount();

    const formatContractReads = (data: any) => {
        if (data && data[0].status === "success") {
            return {
                mintLimit: formatUnits(
                    data[0].result as bigint,
                    Number(data[1].result)
                ),
                decimals: Number(data[1].result),
            };
        }
    };

    const { data } = useContractReads({
        contracts: [
            {
                address: token as `0x`,
                abi: [
                    {
                        inputs: [],
                        name: "mintLimit",
                        outputs: [
                            {
                                internalType: "uint256",
                                name: "",
                                type: "uint256",
                            },
                        ],
                        stateMutability: "view",
                        type: "function",
                    },
                ],
                functionName: "mintLimit",
            },
            {
                address: token as `0x`,
                abi: [
                    {
                        inputs: [],
                        name: "decimals",
                        outputs: [
                            { internalType: "uint8", name: "", type: "uint8" },
                        ],
                        stateMutability: "view",
                        type: "function",
                    },
                ],
                functionName: "decimals",
            },
        ],
        select: (data) => formatContractReads(data),
        cacheTime: 5000,
        enabled: !!token,
    });

    const { data: mintResponse, write } = useContractWrite({
        address: token as `0x`,
        abi: erc20_abi,
        functionName: "mint",
        onError() {
            setLoading(false);
            enqueueSnackbar("Transaction failed", { variant: "error" });
        },
    });

    useWaitForTransaction({
        hash: mintResponse?.hash,
        onSettled(d, error) {
            setLoading(false);
            if (error) {
                enqueueSnackbar(error.message, { variant: "error" });
            } else if (d) {
                setAmount("");
                enqueueSnackbar(`Tokens successfully minted`, {
                    variant: "success",
                });
            }
        },
    });

    const { decimals, mintLimit } = data
        ? data
        : { decimals: 0, mintLimit: "0" };

    const mintToken = () => {
        setLoading(true);
        write?.({ args: [parseUnits(amount, decimals)] });
    };

    return (
        <div className="flex flex-col md:flex-row md:space-x-2 justify-between mt-2">
            <div className="flex w-full md:w-auto md:space-x-2">
                <Select
                    onValueChange={SetToken}
                    aria-label="select-token-symbol"
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Token" />
                    </SelectTrigger>
                    <SelectContent>
                        {tokens.map((token) => (
                            <SelectItem
                                value={token.address}
                                key={token.address}
                            >
                                {token.symbol}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex w-full md:w-auto md:space-x-2 md:my-0 my-2">
                <Label htmlFor="amount-wanted" className="m-2">
                    Mint Amount
                </Label>
                <Input
                    type="text"
                    value={amount}
                    aria-label="tokens-amount"
                    onChange={(e) => setAmount(e.currentTarget.value)}
                    max={Number(mintLimit)}
                    disabled={!mintLimit}
                    className="w-full"
                />
                {Number(mintLimit) > 0 && (
                    <span
                        className="cursor-pointer text-green-500 hover:text-black"
                        onClick={() => setAmount(`${Number(mintLimit)}`)}
                    >
                        Max: {Number(mintLimit)}
                    </span>
                )}
            </div>
            <div className="flex flex-col w-full md:w-auto md:space-x-2 mt-2 md:mt-0">
                <Button
                    onClick={isConnected ? mintToken : open}
                    disabled={
                        Number(mintLimit) - Number(amount) >=
                            Number(mintLimit) || loading
                    }
                    className="w-full"
                >
                    {loading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Mint
                </Button>
            </div>
        </div>
    );
};

export default MintFaucet;
