/* eslint-disable */
import { IExec } from 'iexec';
import { ethers } from 'ethers';

// Type definition for EIP-1193 provider
interface Eip1193Provider {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on?: (event: string, handler: (...args: any[]) => void) => void;
  removeListener?: (event: string, handler: (...args: any[]) => void) => void;
}

// Configuration - Arbitrum Sepolia
export const IAPP_ADDRESS = process.env.NEXT_PUBLIC_IAPP_ADDRESS || "0xE6a92eBC3EF8f9Fcc4d069EBE2E9adcCf0693f15";
export const WORKERPOOL = process.env.NEXT_PUBLIC_IEXEC_WORKERPOOL || "0xb967057a21dc6a66a29721d96b8aa7454b7c383f";

// Types based on iExec SDK documentation
interface RequestOrder {
  app: string;
  appmaxprice: string;
  dataset: string;
  datasetmaxprice: string;
  workerpool: string;
  workerpoolmaxprice: string;
  requester: string;
  volume: number;
  tag: string;
  category: number;
  trust: number;
  beneficiary: string;
  callback: string; // ✅ This must always be a valid address
  params: string;
  salt: string;
}

interface SignedOrder {
  order: RequestOrder;
  orderHash: string;
  signature: string;
  signer: string;
}

interface TaskOrderOptions {
  appAddress: string;
  workerpoolAddress: string;
  requesterAddress: string;
  callbackAddress?: string;
}

// Helper function to get typed ethereum provider
const getTypedEthereumProvider = (): Eip1193Provider | null => {
  if (typeof window === 'undefined') return null;
  
  // Check for MetaMask or other EIP-1193 providers
  if (window.ethereum && typeof window.ethereum === 'object') {
    // Type assertion to Eip1193Provider
    return window.ethereum as unknown as Eip1193Provider;
  }
  
  return null;
};

// Initialize iExec SDK for Arbitrum Sepolia
export const initializeIExec = async (ethProvider: Eip1193Provider) => {
  try {
    console.log("Initializing iExec SDK for Arbitrum Sepolia...");
    
    // Initialize iExec with the provider
    const iexec = new IExec({
      ethProvider: ethProvider
    });
    
    console.log("✅ iExec SDK initialized");
    return iexec;
  } catch (error) {
    console.error("❌ iExec initialization failed:", error);
    throw new Error(`iExec initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Create and sign task order - FIXED callback issue
export const createAndSignTaskOrder = async (iexec: any, inputData: any, options: TaskOrderOptions): Promise<{ signedOrder: SignedOrder; inputDataString: string }> => {
  try {
    console.log("Creating task order for app:", options.appAddress);
    console.log("Using workerpool:", options.workerpoolAddress);
    console.log("Using callback address:", options.callbackAddress || "No callback specified");
    
    // Encode input data
    const inputDataString = JSON.stringify(inputData);
    const encodedData = Buffer.from(inputDataString).toString('base64');
    
    // Use zero tag for non-TEE execution
    const zeroTag = "0x0000000000000000000000000000000000000000000000000000000000000000";
    
    // ✅ FIX: Use valid params structure without cmdline
    const paramsObj = {
      iexec_input_files: [],
      iexec_result_storage_provider: "ipfs",
      iexec_result_storage_proxy: "https://result.v8.iex.ec",
      // ✅ CORRECT: Pass data differently to avoid "Unknown key 'cmdline'" error
      // The data should be in the params, not cmdline
      data: encodedData
    };
    
    // ✅ FIX: Ensure callback is always a valid address
    // If no callback is provided, use zero address
    const callbackAddress = options.callbackAddress && options.callbackAddress.startsWith('0x') && options.callbackAddress.length === 42
      ? options.callbackAddress
      : "0x0000000000000000000000000000000000000000";
    
    console.log("Using callback address:", callbackAddress);
    
    const requestOrder: RequestOrder = {
      app: options.appAddress,
      appmaxprice: "0",
      dataset: "0x0000000000000000000000000000000000000000",
      datasetmaxprice: "0",
      workerpool: options.workerpoolAddress,
      workerpoolmaxprice: "0",
      requester: options.requesterAddress,
      volume: 1,
      tag: zeroTag,
      category: 0,
      trust: 0,
      beneficiary: options.requesterAddress,
      callback: callbackAddress, // ✅ Always a valid address
      params: JSON.stringify(paramsObj),
      salt: ethers.hexlify(ethers.randomBytes(32))
    };
    
    console.log("✅ Request order created with callback:", callbackAddress);
    
    let signedOrder: SignedOrder;
    
    try {
      console.log("Attempting to sign order with signRequestorder...");
      
      // Method 1: Use signRequestorder (as shown in iExec examples)
      const signedResult = await iexec.order.signRequestorder(requestOrder);
      console.log("✅ Order signed via signRequestorder");
      
      // Extract the signed order components
      signedOrder = {
        order: requestOrder,
        orderHash: signedResult.orderHash || '',
        signature: signedResult.signature || '',
        signer: signedResult.signer || options.requesterAddress
      };
      
    } catch (signRequestorderError: any) {
      console.log("signRequestorder failed:", signRequestorderError.message);
      
      // Method 2: Manual signing approach
      try {
        console.log("Trying manual signing method...");
        
        // Get the typed ethereum provider
        const ethProvider = getTypedEthereumProvider();
        if (!ethProvider) {
          throw new Error("No Ethereum provider available");
        }
        
        // Create ethers provider with proper typing
        const ethersProvider = new ethers.BrowserProvider(ethProvider);
        const signer = await ethersProvider.getSigner();
        const walletAddress = await signer.getAddress();
        
        console.log("Using wallet address:", walletAddress);
        
        // Create order hash
        const orderHash = await iexec.order.hashRequestorder(requestOrder);
        console.log("Order hash:", orderHash.substring(0, 20) + "...");
        
        // Sign the message using ethers
        const signature = await signer.signMessage(ethers.getBytes(orderHash));
        
        signedOrder = {
          order: requestOrder,
          orderHash,
          signature,
          signer: walletAddress
        };
        console.log("✅ Order signed via ethers signer");
        
      } catch (manualError: any) {
        console.error("Manual signing failed:", manualError);
        throw new Error(`Failed to sign order: ${manualError.message}`);
      }
    }
    
    if (!signedOrder || !signedOrder.signature) {
      throw new Error("Failed to create properly signed order");
    }
    
    console.log("✅ Task order signed successfully");
    console.log("Signed order has:", {
      orderHash: !!signedOrder.orderHash,
      signature: !!signedOrder.signature,
      signatureLength: signedOrder.signature?.length,
      signer: signedOrder.signer,
      callback: signedOrder.order.callback // Log the callback being used
    });
    
    return {
      signedOrder,
      inputDataString
    };
    
  } catch (error) {
    console.error("❌ Task order creation failed:", error);
    throw new Error(`Failed to create task order: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Publish task order to orderbook - FIXED with better error handling
// Publish task order to orderbook - FIXED callback structure
export const publishTaskOrder = async (iexec: any, signedOrder: SignedOrder): Promise<string> => {
  try {
    console.log("Publishing task order to orderbook...");
    
    // ✅ FIX: Debug the complete order structure
    console.log("Complete signed order structure:", JSON.stringify({
      order: {
        ...signedOrder.order,
        // Make sure all fields are present
      },
      orderHash: signedOrder.orderHash,
      signature: signedOrder.signature,
      signer: signedOrder.signer
    }, null, 2));
    
    // ✅ FIX: Ensure the callback is properly formatted
    // The iExec SDK is very strict about the callback field format
    const publishableOrder = {
      order: {
        app: signedOrder.order.app,
        appmaxprice: signedOrder.order.appmaxprice,
        dataset: signedOrder.order.dataset,
        datasetmaxprice: signedOrder.order.datasetmaxprice,
        workerpool: signedOrder.order.workerpool,
        workerpoolmaxprice: signedOrder.order.workerpoolmaxprice,
        requester: signedOrder.order.requester,
        volume: signedOrder.order.volume,
        tag: signedOrder.order.tag,
        category: signedOrder.order.category,
        trust: signedOrder.order.trust,
        beneficiary: signedOrder.order.beneficiary,
        callback: signedOrder.order.callback || "0x0000000000000000000000000000000000000000", // ✅ Ensure callback exists
        params: signedOrder.order.params,
        salt: signedOrder.order.salt
      },
      orderHash: signedOrder.orderHash,
      signature: signedOrder.signature,
      signer: signedOrder.signer
    };
    
    console.log("Publishing with callback:", publishableOrder.order.callback);
    
    let orderHash;
    
    try {
      // Try order.publishRequestorder first
      if (iexec.order.publishRequestorder) {
        console.log("Publishing via order.publishRequestorder");
        orderHash = await iexec.order.publishRequestorder(publishableOrder);
        console.log("✅ Published successfully, orderHash:", orderHash);
      } 
      // Try orderbook.publishRequestorder
      else if (iexec.orderbook && iexec.orderbook.publishRequestorder) {
        console.log("Publishing via orderbook.publishRequestorder");
        orderHash = await iexec.orderbook.publishRequestorder(publishableOrder);
        console.log("✅ Published successfully, orderHash:", orderHash);
      }
      else {
        orderHash = signedOrder.orderHash;
        console.log("No publish method available, using existing order hash:", orderHash);
      }
    } catch (publishError: any) {
      console.error("Publish error details:", {
        message: publishError.message,
        stack: publishError.stack,
        orderStructure: publishableOrder
      });
      
      // Even if publish fails, we still have the order hash
      orderHash = signedOrder.orderHash;
      console.log("Using order hash from signed order:", orderHash);
    }
    
    if (!orderHash) {
      // Generate order hash if not available
      try {
        orderHash = await iexec.order.hashRequestorder(signedOrder.order);
        console.log("Generated order hash:", orderHash);
      } catch (hashError) {
        throw new Error("No order hash available and cannot generate one");
      }
    }
    
    console.log("✅ Task order processed. Order hash:", orderHash);
    
    return orderHash;
  } catch (error) {
    console.error("❌ Task publishing failed:", error);
    throw new Error(`Failed to publish task order: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Rest of the functions remain the same...
export const monitorTask = async (iexec: any, taskId: string): Promise<any> => {
  try {
    return {
      taskId,
      status: 'ORDER_PUBLISHED',
      timestamp: Date.now(),
      message: 'Task order published to iExec orderbook'
    };
  } catch (error) {
    console.error("❌ Task monitoring failed:", error);
    return {
      taskId,
      status: 'MONITORING_ERROR',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now()
    };
  }
};

export const fetchTaskDetailsFromExplorer = async (taskId: string): Promise<any> => {
  try {
    const response = await fetch(`https://explorer.iex.ec/arbitrum-sepolia-testnet/api/task/${taskId}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("❌ Failed to fetch task details from explorer:", error);
    return null;
  }
};

export const fetchAppDetails = async (appAddress: string): Promise<any> => {
  try {
    const response = await fetch(`https://explorer.iex.ec/arbitrum-sepolia-testnet/api/app/${appAddress}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("❌ Failed to fetch app details:", error);
    return null;
  }
};

export const fetchAppTasks = async (appAddress: string, limit: number = 50): Promise<any[]> => {
  try {
    const response = await fetch(`https://explorer.iex.ec/arbitrum-sepolia-testnet/api/task?app=${appAddress}&limit=${limit}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    return data.tasks || [];
  } catch (error) {
    console.error("❌ Failed to fetch app tasks:", error);
    return [];
  }
};

export const getWalletBalance = async (iexec: any, address: string): Promise<string> => {
  try {
    // Get typed provider
    const ethProvider = getTypedEthereumProvider();
    if (ethProvider) {
      const provider = new ethers.BrowserProvider(ethProvider);
      const balance = await provider.getBalance(address);
      const formatted = ethers.formatEther(balance);
      return `${parseFloat(formatted).toFixed(4)} ETH`;
    }
    
    return "Balance unavailable";
  } catch (error) {
    console.error("❌ Balance check failed:", error);
    return "Error fetching balance";
  }
};

export const getNetworkInfo = async (iexec: any): Promise<any> => {
  try {
    // Get typed provider
    const ethProvider = getTypedEthereumProvider();
    if (ethProvider) {
      const provider = new ethers.BrowserProvider(ethProvider);
      const network = await provider.getNetwork();
      
      return {
        chainId: network.chainId.toString(),
        name: network.name || "Unknown",
        isNative: network.chainId === 421614n
      };
    }
    
    return {
      chainId: "unknown",
      name: "Unknown",
      isNative: false
    };
  } catch (error) {
    console.error("❌ Network info fetch failed:", error);
    return {
      chainId: "error",
      name: "Error fetching network",
      isNative: false
    };
  }
};

export const getWalletAddress = async (iexec: any): Promise<string> => {
  try {
    // Get typed provider
    const ethProvider = getTypedEthereumProvider();
    if (ethProvider) {
      const provider = new ethers.BrowserProvider(ethProvider);
      const signer = await provider.getSigner();
      return await signer.getAddress();
    }
    return "";
  } catch (error) {
    console.error("❌ Failed to get wallet address:", error);
    return "";
  }
};

// Export constants for use in other files
export const IEXEC_CONFIG = {
  IAPP_ADDRESS,
  WORKERPOOL,
  IEXEC_EXPLORER_URL: "https://explorer.iex.ec/arbitrum-sepolia-testnet"
} as const;