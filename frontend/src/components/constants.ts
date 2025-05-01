export const Contract_Address = "0xc07FEE263c41EA339F8845ff325808552FEb9068";
export const Contract_Abi = [
  {
    inputs: [],
    name: "AlreadyFlagOwner",
    type: "error",
  },
  {
    inputs: [],
    name: "NotFlagOwner",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "capturer",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "FlagCaptured",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "releaser",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "FlagReleased",
    type: "event",
  },
  {
    inputs: [],
    name: "captureFlag",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getFlagStatus",
    outputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "captureTime",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "releaseFlag",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];
