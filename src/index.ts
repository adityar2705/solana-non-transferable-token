//import necessary functions and packages
import { Connection, Keypair } from "@solana/web3.js";
import { initializeKeypair } from "@solana-developers/helpers";
import dotenv from "dotenv";
import {
  createAccount,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_2022_PROGRAM_ID,
  transferChecked,
} from "@solana/spl-token";
import { createNonTransferableMint } from "./create-mint";
dotenv.config();

//create connection and payer
const connection = new Connection('http://127.0.0.1:8899', "confirmed");
const payer = await initializeKeypair(connection);

console.log(`Payer public key is : ${payer.publicKey}.`);

//create the mint keypair
const mintKeypair = Keypair.generate();
const mint = mintKeypair.publicKey;

//create the non-transferable mint using our custom function
const decimals = 9;
await createNonTransferableMint(connection, payer, mintKeypair, decimals);

//create payer ATA and mint a token
const ata = (
    await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mint,
      payer.publicKey,
      undefined,
      undefined,
      undefined,
      TOKEN_2022_PROGRAM_ID,
    )
).address;

//minting 1 non-transferable token
const amount = 1*10**decimals;
console.log("Attempting to mint 1 token to the payer ATA.");
await mintTo(
    connection,
    payer,
    mint,
    ata,
    payer,
    amount,
    [payer],
    { commitment: "finalized" },
    TOKEN_2022_PROGRAM_ID,
);

//get the balance of the current token account we just created -> passing the address of the account that we need
const tokenBalance = await connection.getTokenAccountBalance(ata, "finalized");
console.log(
    `Account ${ata.toBase58()} now has ${tokenBalance.value.uiAmount} token.`,
);

//create a destination account for transfer
const destinationKeypair = Keypair.generate();
const destinationAccount = await createAccount(
    connection,
    payer,
    mint,
    destinationKeypair.publicKey,
    undefined,
    { commitment: "finalized" },
    TOKEN_2022_PROGRAM_ID
);

//try transferring this non-transferable token
try{
   const signature = await transferChecked(connection, payer, ata, mint, destinationAccount, ata, amount, decimals, [destinationKeypair], { commitment: "finalized" },TOKEN_2022_PROGRAM_ID);

}catch(error){
    console.log("Transaction failed as this is a non-transferable token.");
}



