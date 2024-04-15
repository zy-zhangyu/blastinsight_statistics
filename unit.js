const API_KEY = 'ZQW9Q75PC212BH4QV9BP4NAWJSK2S4EHNQ';
const ETH_USD_API_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd';

async function getAllSuccessfulTransactions(address) {
    const BASE_URL = "https://api.blastscan.io/api";
    const params = {
        module: "account",
        action: "txlist",
        address: address,
        startblock: 0,
        endblock: 'latest',
        page: 1,
        offset: 10000,
        sort: 'asc',
        apikey: API_KEY
    };

    try {
        const response = await axios.get(BASE_URL, { params });
        if (response.data.status === '1') {
            const transactions = response.data.result;
            const successfulTransactions = transactions.filter(transaction => transaction.txreceipt_status === '1'); // 获取成功的交易
            const successfulTransactionsValue = successfulTransactions.map(transaction => parseFloat(transaction.value) / 10 ** 18); // 提取每笔成功交易的交易价值

            console.log("successfulTransactionsValue", successfulTransactionsValue);
            return {
                successfulTransactions: successfulTransactions,
                successfulTransactionsCount: successfulTransactions.length
            };

        } else {
            console.error("Error fetching transactions:", response.data.message);
            return {
                successfulTransactions: [],
                successfulTransactionsCount: 0
            };
        }
    } catch (error) {
        console.error("Failed to fetch transactions:", error);
        return {
            successfulTransactions: [],
            successfulTransactionsCount: 0
        };
    }
}


async function calculateTotalValueOfTransactions(address) {
    const { successfulTransactions, successfulTransactionsCount } = await getAllSuccessfulTransactions(address);
    let totalValue = 0;

    successfulTransactions.forEach(transaction => {
        const ethValue = parseFloat(transaction.value) / 10 ** 18;
        totalValue += ethValue;
        console.log(totalValue)
    });

    return { totalValue, transactionsucessnumber: successfulTransactionsCount };
}


async function getEthBalance(address) {
    const BASE_URL = "https://api.blastscan.io/api";
    const params = {
        module: "account",
        action: "balance",
        address: address,
        tag: "latest",
        apikey: API_KEY
    };

    try {
        const response = await axios.get(BASE_URL, { params });
        if (response.data.status === '1') {
            return parseFloat(Web3.utils.fromWei(response.data.result, 'ether'));
        } else {
            console.error("Error fetching ETH balance:", response.data.message);
            return 0;
        }
    } catch (error) {
        console.error("Failed to fetch ETH balance:", error);
        return 0;
    }
}
async function getTokenToUsdRate(token_id) {
    try {
        const tokenToEthRateResponse = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${token_id}&vs_currencies=eth`);
        const tokenToEthRate = tokenToEthRateResponse.data[token_id].eth;
        console.log(tokenToEthRate)
        return tokenToEthRate;
    } catch (error) {
        console.error("Failed to fetch token to USD rate:", error);
        return 0;
    }
}
async function getAllSuccessfulTransactionsLastMonth(address) {
    try {
        // 计算起止时间戳
        const today = new Date();
        const endDate = Math.floor(today / 1000); // 今天的时间戳
        const startDate = endDate - (30 * 24 * 60 * 60); // 30天前的时间戳

        // 使用 Blast API 获取在上 30 天内的所有交易
        const BASE_URL = "https://api.blastscan.io/api";
        const params = {
            module: "account",
            action: "txlist",
            address: address,
            startblock: 0,
            endblock: 'latest',
            page: 1,
            offset: 10000,
            sort: 'asc',
            apikey: API_KEY
        };

        const response = await axios.get(BASE_URL, { params });
        if (response.data.status === '1') {
            const transactions = response.data.result;
            // 过滤出上 30 天内成功的交易
            const successfulTransactionsLast30Days = transactions.filter(transaction => {
                const timestamp = parseInt(transaction.timeStamp);
                return timestamp >= startDate && timestamp <= endDate && transaction.txreceipt_status === '1';
            });
            return successfulTransactionsLast30Days;
        } else {
            console.error("Error fetching transactions:", response.data.message);
            return [];
        }
    } catch (error) {
        console.error("Failed to fetch transactions:", error);
        return [];
    }
}
async function getAllSuccessfulTransactionsLastYear(address) {
    try {
        // 计算起止时间戳
        const today = new Date();
        const endTimestamp = Math.floor(today / 1000); // 当前时间的时间戳
        const startTimestamp = endTimestamp - (365 * 24 * 60 * 60); // 当前时间向前推 365 天的时间戳

        // 使用 Blast API 获取在过去一年内的所有交易
        const BASE_URL = "https://api.blastscan.io/api";
        const params = {
            module: "account",
            action: "txlist",
            address: address,
            startblock: 0,
            endblock: 'latest',
            page: 1,
            offset: 10000,
            sort: 'asc',
            apikey: API_KEY
        };

        const response = await axios.get(BASE_URL, { params });
        if (response.data.status === '1') {
            const transactions = response.data.result;
            // 过滤出过去一年内成功的交易
            const successfulTransactionsLastYear = transactions.filter(transaction => {
                const timestamp = parseInt(transaction.timeStamp);
                return timestamp >= startTimestamp && timestamp <= endTimestamp && transaction.txreceipt_status === '1';
            });
            return successfulTransactionsLastYear;
        } else {
            console.error("Error fetching transactions:", response.data.message);
            return [];
        }
    } catch (error) {
        console.error("Failed to fetch transactions:", error);
        return [];
    }
}

async function getBalanceChange(address) {
    try {
        // 获取上个月成功交易的总交易额
        const lastMonthTransactions = await getAllSuccessfulTransactionsLastMonth(address);
        const lastMonthTransactionValue = lastMonthTransactions.reduce((total, transaction) => {
            return total + parseFloat(transaction.value) / 10 ** 18;
        }, 0);

        return lastMonthTransactionValue;
    } catch (error) {
        console.error("Failed to calculate balance change:", error);
        return 0;
    }
}
async function getWalletAgeInMonths(address) {
    try {
        const BASE_URL = "https://api.blastscan.io/api";
        const params = {
            module: "account",
            action: "txlist",
            address: address,
            startblock: 0,
            endblock: 'latest',
            page: 1,
            offset: 1,
            sort: 'asc',
            apikey: API_KEY
        };

        const response = await axios.get(BASE_URL, { params });
        if (response.data.status === '1') {
            const transactions = response.data.result;
            if (transactions.length > 0) {
                const firstTransactionTimestamp = parseInt(transactions[0].timeStamp);
                const currentTimestamp = Math.floor(Date.now() / 1000);
                const ageInSeconds = currentTimestamp - firstTransactionTimestamp;
                const ageInMonths = Math.floor(ageInSeconds / (30 * 24 * 60 * 60)); // 向下取整为整数月份
                return ageInMonths;
            } else {
                console.error("No transactions found for the address.");
                return 0;
            }
        } else {
            console.error("Error fetching transactions:", response.data.message);
            return 0;
        }
    } catch (error) {
        console.error("Failed to fetch transactions:", error);
        return 0;
    }
}
async function getTotalRejectedTransactions(address) {
    const BASE_URL = "https://api.blastscan.io/api";
    const params = {
        module: "account",
        action: "txlist",
        address: address,
        startblock: 0,
        endblock: 'latest',
        page: 1,
        offset: 10000,
        sort: 'asc',
        apikey: API_KEY
    };

    try {
        const response = await axios.get(BASE_URL, { params });
        if (response.data.status === '1') {
            const transactions = response.data.result;
            const rejectedTransactions = transactions.filter(transaction => transaction.txreceipt_status === '0'); // 获取被拒绝的交易
            const totalRejectedTransactions = rejectedTransactions.length; // 计算被拒绝交易的总数
            return totalRejectedTransactions;
        } else {
            console.error("Error fetching transactions:", response.data.message);
            return 0;
        }
    } catch (error) {
        console.error("Failed to fetch transactions:", error);
        return 0;
    }
}

async function getTransactionIntervals(address) {
    const BASE_URL = "https://api.blastscan.io/api";
    const params = {
        module: "account",
        action: "txlist",
        address: address,
        startblock: 0,
        endblock: 'latest',
        page: 1,
        offset: 10000,
        sort: 'asc',
        apikey: API_KEY
    };

    try {
        const response = await axios.get(BASE_URL, { params });
        if (response.data.status === '1') {
            const transactions = response.data.result;
            if (transactions.length <= 1) {
                return { averageInterval: 0, maxInterval: 0 };
            }

            // 确保交易按时间戳升序排列
            transactions.sort((a, b) => parseInt(a.timeStamp) - parseInt(b.timeStamp));

            const timestamps = transactions.map(transaction => parseInt(transaction.timeStamp));
            const timeIntervals = [];
            for (let i = 1; i < timestamps.length; i++) {
                const interval = timestamps[i] - timestamps[i - 1];
                timeIntervals.push(interval);
            }

            const averageInterval = timeIntervals.reduce((sum, interval) => sum + interval, 0) / (timeIntervals.length - 1);
            const maxInterval = Math.max(...timeIntervals);

            return { averageInterval: averageInterval / (60 * 60), maxInterval: maxInterval / (60 * 60) }; // Convert to hours
        } else {
            console.error("Error fetching transactions:", response.data.message);
            return { averageInterval: 0, maxInterval: 0 };
        }
    } catch (error) {
        console.error("Failed to fetch transactions:", error);
        return { averageInterval: 0, maxInterval: 0 };
    }
}
async function getTimeSinceLastTransaction(address) {
    const BASE_URL = "https://api.blastscan.io/api";
    const params = {
        module: "account",
        action: "txlist",
        address: address,
        startblock: 0,
        endblock: 'latest',
        page: 1,
        offset: 1, // 只获取最新的一笔交易
        sort: 'desc', // 降序排列，以获取最新的交易
        apikey: API_KEY
    };

    try {
        const response = await axios.get(BASE_URL, { params });
        if (response.data.status === '1') {
            const transaction = response.data.result[0]; // 获取最新的交易
            const lastTransactionTimestamp = parseInt(transaction.timeStamp);
            const lastTransactionDate = new Date(lastTransactionTimestamp * 1000); // 将时间戳转换为日期
            const currentDate = new Date(); // 当前日期
            const monthsSinceLastTransaction = (currentDate.getFullYear() - lastTransactionDate.getFullYear()) * 12 +
                (currentDate.getMonth() - lastTransactionDate.getMonth());

            return monthsSinceLastTransaction;
        } else {
            console.error("Error fetching last transaction:", response.data.message);
            return 0;
        }
    } catch (error) {
        console.error("Failed to fetch last transaction:", error);
        return 0;
    }
}
async function getSuccessfulTransactionCountLastMonth(address) {
    try {
        // 获取当前日期和30天前的日期
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);

        // 将日期转换为时间戳（秒）
        const startTimestamp = Math.floor(thirtyDaysAgo.getTime() / 1000);
        const endTimestamp = Math.floor(today.getTime() / 1000);

        // 使用区块链 API 获取指定地址在过去30天内的所有交易列表
        const BASE_URL = "https://api.blastscan.io/api";
        const params = {
            module: "account",
            action: "txlist",
            address: address,
            startblock: 0,
            endblock: 'latest',
            page: 1,
            offset: 10000,
            sort: 'asc',
            apikey: API_KEY
        };
        const response = await axios.get(BASE_URL, { params });

        if (response.data.status === '1') {
            // 过滤出过去30天内的成功交易
            const transactions = response.data.result;
            const successfulTransactionsLast30Days = transactions.filter(transaction => {
                const timestamp = parseInt(transaction.timeStamp);
                return timestamp >= startTimestamp && timestamp <= endTimestamp && transaction.txreceipt_status === '1';
            });

            // 返回过去30天的成功交易数量
            return successfulTransactionsLast30Days.length;
        } else {
            console.error("Error fetching transactions:", response.data.message);
            return 0;
        }
    } catch (error) {
        console.error("Failed to fetch transactions:", error);
        return 0;
    }
}

async function getSuccessfulTransactionCountLastYear(address) {
    try {
        // 获取当前日期和一年前的日期
        const today = new Date();
        const oneYearAgo = new Date(today);
        oneYearAgo.setDate(today.getDate() - 365);

        // 将日期转换为时间戳（秒）
        const startTimestamp = Math.floor(oneYearAgo.getTime() / 1000);
        const endTimestamp = Math.floor(today.getTime() / 1000);

        // 使用区块链 API 获取指定地址在过去365天内的所有交易列表
        const BASE_URL = "https://api.blastscan.io/api";
        const params = {
            module: "account",
            action: "txlist",
            address: address,
            startblock: 0,
            endblock: 'latest',
            page: 1,
            offset: 10000,
            sort: 'asc',
            apikey: API_KEY
        };
        const response = await axios.get(BASE_URL, { params });

        if (response.data.status === '1') {
            // 过滤出过去365天内的成功交易
            const transactions = response.data.result;
            const successfulTransactionsLastYear = transactions.filter(transaction => {
                const timestamp = parseInt(transaction.timeStamp);
                return timestamp >= startTimestamp && timestamp <= endTimestamp && transaction.txreceipt_status === '1';
            });

            // 返回过去365天的成功交易数量
            return successfulTransactionsLastYear.length;
        } else {
            console.error("Error fetching transactions:", response.data.message);
            return 0;
        }
    } catch (error) {
        console.error("Failed to fetch transactions:", error);
        return 0;
    }
}
async function getAverageTransactionsPerMonth(address) {
    try {
        // 获取第一笔交易的时间戳和月份
        const { firstTransactionDate, firstTransactionMonth } = await getFirstTransactionInfo(address);

        if (!firstTransactionDate) {
            console.error("Failed to get first transaction information.");
            return 0;
        }

        // 获取当前时间的月份
        const currentMonth = new Date().getMonth() + 1; // JavaScript中月份从0开始，因此需要加1

        // 统计每个月的交易成功数量
        const transactionsPerMonth = await getTransactionsPerMonth(address, firstTransactionDate, currentMonth);

        // 计算平均每月的交易成功数量
        const totalMonths = currentMonth - firstTransactionMonth + 1; // 加1是因为包括第一个月
        const totalTransactions = transactionsPerMonth.reduce((total, transactions) => total + transactions, 0);
        const averageTransactionsPerMonth = Math.floor(totalTransactions / totalMonths);

        return averageTransactionsPerMonth;
    } catch (error) {
        console.error("Failed to calculate average transactions per month:", error);
        return 0;
    }
}


async function getFirstTransactionInfo(address) {
    try {
        // 使用区块链 API 获取指定地址的第一笔交易
        const BASE_URL = "https://api.blastscan.io/api";
        const params = {
            module: "account",
            action: "txlist",
            address: address,
            startblock: 0,
            endblock: 'latest',
            page: 1,
            offset: 1,
            sort: 'asc',
            apikey: API_KEY
        };
        const response = await axios.get(BASE_URL, { params });

        if (response.data.status === '1' && response.data.result.length > 0) {
            // 获取第一笔交易的时间戳
            const firstTransactionTimestamp = parseInt(response.data.result[0].timeStamp);
            // 转换为 JavaScript 日期对象
            const firstTransactionDate = new Date(firstTransactionTimestamp * 1000);
            // 提取月份
            const firstTransactionMonth = firstTransactionDate.getMonth() + 1; // JavaScript中月份从0开始，因此需要加1
            return { firstTransactionDate, firstTransactionMonth };
        } else {
            console.error("Error fetching first transaction:", response.data.message);
            return { firstTransactionDate: null, firstTransactionMonth: 0 };
        }
    } catch (error) {
        console.error("Failed to fetch first transaction:", error);
        return { firstTransactionDate: null, firstTransactionMonth: 0 };
    }
}


// 统计每个月的交易成功数量
async function getTransactionsPerMonth(address, firstTransactionTimestamp, currentMonth) {
    const transactionsPerMonth = Array(currentMonth).fill(0); // 初始化数组，每个月的交易数量都为0
    const BASE_URL = "https://api.blastscan.io/api";

    for (let month = firstTransactionTimestamp.getMonth(); month < currentMonth; month++) {
        const startOfMonth = new Date(firstTransactionTimestamp.getFullYear(), month, 1);
        const endOfMonth = new Date(firstTransactionTimestamp.getFullYear(), month + 1, 0);

        try {
            const params = {
                module: "account",
                action: "txlist",
                address: address,
                startblock: 0,
                endblock: 'latest',
                page: 1,
                offset: 10000,
                sort: 'asc',
                starttime: startOfMonth.getTime() / 1000,
                endtime: endOfMonth.getTime() / 1000,
                apikey: API_KEY
            };
            const response = await axios.get(BASE_URL, { params });

            if (response.data.status === '1') {
                const transactions = response.data.result.filter(transaction => transaction.txreceipt_status === '1');
                transactionsPerMonth[month] = transactions.length;
            } else {
                console.error("Error fetching transactions:", response.data.message);
            }
        } catch (error) {
            console.error("Failed to fetch transactions:", error);
        }
    }

    return transactionsPerMonth;
}


(async () => {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const address = accounts[0];

    const { totalValue, transactionsucessnumber } = await calculateTotalValueOfTransactions(address);
    const balance = await getEthBalance(address);
    const ethToUsdRate = await getTokenToUsdRate('usdb');
    const totalValueusd = totalValue / ethToUsdRate;
    const balanceUsd = balance / ethToUsdRate;
    const balanceChange = await getBalanceChange(address);
    const successfulTransactionsLastYear = await getAllSuccessfulTransactionsLastYear(address);
    const balanceChangeLastYear = successfulTransactionsLastYear.reduce((total, transaction) => {
        return total + parseFloat(transaction.value) / 10 ** 18;
    }, 0);
    const walletAgeInMonths = await getWalletAgeInMonths(address);
    const rejectedTxNumber = await getTotalRejectedTransactions(address);
    const { averageInterval, maxInterval } = await getTransactionIntervals(address);
    const timesinelastTx = await getTimeSinceLastTransaction(address);
    const lastMonthTxCount = await getSuccessfulTransactionCountLastMonth(address);
    const lastYearTxCount = await getSuccessfulTransactionCountLastYear(address);
    const averageTxInternal = await getAverageTransactionsPerMonth(address);

    document.getElementById("balance").innerText = balance.toFixed(6);
    document.getElementById("balanceusd").innerText = balanceUsd.toFixed(2);
    document.getElementById("totalvalue").innerText = totalValue.toFixed(4);
    document.getElementById("totalvalueusd").innerText = totalValueusd.toFixed(2);
    document.getElementById("balancechangelastmonth").innerText = balanceChange.toFixed(4);
    document.getElementById("balancechangelastyear").innerText = balanceChangeLastYear.toFixed(4);
    document.getElementById("walletage").innerText = walletAgeInMonths;
    document.getElementById("txsucessnumber").innerText = transactionsucessnumber;
    document.getElementById("rejectedTxNumber").innerText = rejectedTxNumber;
    document.getElementById("averageInterval").innerText = averageInterval.toFixed(2);
    document.getElementById("maxInterval").innerText = maxInterval.toFixed(2);
    document.getElementById("timesinelastTx").innerText = timesinelastTx;
    document.getElementById("lastMonthTxCount").innerText = lastMonthTxCount;
    document.getElementById("lastYearTxCount").innerText = lastYearTxCount;
    document.getElementById("averageTxInternal").innerText = averageTxInternal;
})();