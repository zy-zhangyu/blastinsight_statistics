const API_KEY1 = 'ZQW9Q75PC212BH4QV9BP4NAWJSK2S4EHNQ';
const API_KEY2 = 'TSZREJR1QSJDAG5HDAY97INV1TEDUF2AAD';
const API_KEY3 = 'U7FCYTBAB5E5E7AWN1D698T3QUYS9N8BDZ';
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
        apikey: API_KEY1
    };

    try {
        const response = await axios.get(BASE_URL, { params });
        if (response.data.status === '1') {
            const transactions = response.data.result;
            const successfulTransactions = transactions.filter(transaction => transaction.txreceipt_status === '1'); // 获取成功的交易
            const successfulTransactionsValue = successfulTransactions.map(transaction => parseFloat(transaction.value) / 10 ** 18); // 提取每笔成功交易的交易价值

            // console.log("successfulTransactionsValue", successfulTransactionsValue);
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
        // console.log(totalValue)
    });

    return { totalValue, successfulTransactionsCount: totalValue, successfulTransactionsCount };
}


async function getEthBalance(address) {
    const BASE_URL = "https://api.blastscan.io/api";
    const params = {
        module: "account",
        action: "balance",
        address: address,
        tag: "latest",
        apikey: API_KEY1
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
        const response = await fetch(`https://blastinsight-service.zeabur.app/user/${token_id}/getusd`);
        if (!response.ok) {
            throw new Error('Failed to fetch USD rate for the token');
        }
        const data = await response.json();
        return data.usdRate;
    } catch (error) {
        console.error('Error:', error);
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
            apikey: API_KEY1
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
        const endTimestamp = Math.floor(today.getTime() / 1000); // 当前时间的时间戳
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
            apikey: API_KEY1
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
            apikey: API_KEY2
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
        apikey: API_KEY2
    };

    try {
        const response = await axios.get(BASE_URL, { params });
        if (response.data.status === '1') {
            const transactions = response.data.result;
            const rejectedTransactions = transactions.filter(transaction => transaction.txreceipt_status === '0'); // 获取被拒绝的交易
            // console.log("rejectedTransactions" + rejectedTransactions)
            const totalRejectedTransactions = rejectedTransactions.length; // 计算被拒绝交易的总数

            return totalRejectedTransactions;
        } else {
            // console.error("No fetching reject_transactions:", response.data.message);
            return 0;
        }
    } catch (error) {
        // console.error("Failed to fetch transactions:", error);
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
        apikey: API_KEY2
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
            let averageInterval;
            if (timeIntervals.length <= 1) {
                averageInterval = 0;
            } else {
                averageInterval = timeIntervals.reduce((sum, interval) => sum + interval, 0) / (timeIntervals.length - 1);
            }
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
        apikey: API_KEY2
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
            apikey: API_KEY3
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
            apikey: API_KEY3
        };
        const response = await axios.get(BASE_URL, { params });

        if (response.data.status === '1') {
            // 过滤出过去365天内的成功交易
            const transactions = response.data.result;
            // console.log("transactions_lastyear" + transactions)
            const successfulTransactionsLastYear = transactions.filter(transaction => {
                const timestamp = parseInt(transaction.timeStamp);
                return timestamp >= startTimestamp && timestamp <= endTimestamp && transaction.txreceipt_status === '1';
            });
            // console.log("transactions_lastyear" + successfulTransactionsLastYear)
            // 返回过去365天的成功交易数量
            return successfulTransactionsLastYear.length;
        } else {
            // console.error("Error fetching transactions:", response.data.message);
            return 0;
        }
    } catch (error) {
        // console.error("Failed to fetch transactions:", error);
        return 0;
    }
}
async function getAverageTransactionsPerMonth(address) {
    try {
        // 获取第一笔交易的时间戳和月份
        const { firstTransactionTimestamp, firstTransactionMonth } = await getFirstTransactionInfo(address);

        if (firstTransactionTimestamp === 0) {
            console.error("Failed to get first transaction information.");
            return 0;
        }

        // 获取当前时间的月份
        const currentMonth = new Date().getMonth() + 1; // JavaScript中月份从0开始，因此需要加1

        // 统计每个月的交易成功数量
        const transactionsPerMonth = await getTransactionsPerMonth(address, firstTransactionTimestamp, currentMonth);

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

// 获取第一笔交易的时间戳和月份
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
            apikey: API_KEY3
        };
        const response = await axios.get(BASE_URL, { params });

        if (response.data.status === '1' && response.data.result.length > 0) {
            // 获取第一笔交易的时间戳
            const firstTransactionTimestamp = parseInt(response.data.result[0].timeStamp);
            // 将时间戳转换为 Date 对象
            const firstTransactionDate = new Date(firstTransactionTimestamp * 1000);
            // 获取第一笔交易的月份
            const firstTransactionMonth = firstTransactionDate.getMonth() + 1; // JavaScript中月份从0开始，因此需要加1
            return { firstTransactionTimestamp: firstTransactionDate, firstTransactionMonth };
        } else {
            console.error("Error fetching first transaction:", response.data.message);
            return { firstTransactionTimestamp: 0, firstTransactionMonth: 0 };
        }
    } catch (error) {
        console.error("Failed to fetch first transaction:", error);
        return { firstTransactionTimestamp: 0, firstTransactionMonth: 0 };
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
                apikey: API_KEY3
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

// 定义一个函数，用于去除小数点后面的零
function removeTrailingZeros(number) {
    // 转换为字符串，并去除尾部的零和小数点
    return parseFloat(number).toString();
}
async function getAllSuccessfulTransactionsPicture(address) {
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
        apikey: API_KEY3
    };

    try {
        const response = await axios.get(BASE_URL, { params });
        if (response.data.status === '1') {
            const transactions = response.data.result;
            return transactions.filter(transaction => transaction.txreceipt_status === '1'); // 获取成功的交易
        } else {
            console.error("Error fetching transactions:", response.data.message);
            return [];
        }
    } catch (error) {
        console.error("Failed to fetch transactions:", error);
        return [];
    }
}

async function calculateDailyTransactions(address) {
    const transactions = await getAllSuccessfulTransactionsPicture(address);
    const dailyStats = {};
    const startDate = new Date('2024-01-01');
    const endDate = new Date(); // 获取当前日期作为结束日期

    // 循环遍历从起始日期到结束日期的每一天
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        const dayKey = date.toLocaleDateString();
        if (!dailyStats[dayKey]) {
            dailyStats[dayKey] = {
                transactions: 0
            };
        }
    }

    transactions.forEach(transaction => {
        const txDate = new Date(transaction.timeStamp * 1000);
        const dayKey = txDate.toLocaleDateString(); // 使用交易日期作为键值
        if (dailyStats[dayKey]) {
            dailyStats[dayKey].transactions++;
        }
    });

    return dailyStats;
}
async function getTotalSentAmount(address) {
    try {
        const { successfulTransactions, successfulTransactionsCount } = await getAllSuccessfulTransactions(address);

        // 计算所有成功交易中转出的资金总量
        const totalSentAmount = successfulTransactions.reduce((total, transaction) => {
            // 只考虑转出的交易
            if (transaction.from.toLowerCase() === address.toLowerCase()) {
                total += parseFloat(transaction.value) / 10 ** 18;
            }
            return total;
        }, 0);

        return totalSentAmount;
    } catch (error) {
        console.error("Failed to calculate total sent amount:", error);
        return 0;
    }
}

(async () => {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const address = accounts[0];
    // const address = "0x6BC58Daa01464c9A0a81aEa8145a335e46F24E36";

    const { totalValue, successfulTransactionsCount } = await calculateTotalValueOfTransactions(address);
    const balance = await getEthBalance(address);
    const ethToUsdRate = await getTokenToUsdRate('ethereum');
    // console.log("ethToUsdRate" + ethToUsdRate)
    const totalValueusd = totalValue * ethToUsdRate;
    const balanceUsd = balance * ethToUsdRate;
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
    const totalSentAmount = await getTotalSentAmount(address);
    const totalspendAmount = totalSentAmount * ethToUsdRate;
    // console.log("totalSentAmount: $" + totalSentAmount)
    console.log("totalspendAmount: $" + totalspendAmount)



    document.getElementById("balance").innerText = removeTrailingZeros(balance.toFixed(6));
    document.getElementById("balanceusd").innerText = removeTrailingZeros(balanceUsd.toFixed(2));
    document.getElementById("totalvalue").innerText = removeTrailingZeros(totalValue.toFixed(4));
    document.getElementById("totalvalueusd").innerText = removeTrailingZeros(totalValueusd.toFixed(2));
    document.getElementById("balancechangelastmonth").innerText = removeTrailingZeros(balanceChange.toFixed(4));
    document.getElementById("balancechangelastyear").innerText = removeTrailingZeros(balanceChangeLastYear.toFixed(4));
    document.getElementById("walletage").innerText = removeTrailingZeros(walletAgeInMonths);
    document.getElementById("txsucessnumber").innerText = removeTrailingZeros(successfulTransactionsCount);
    document.getElementById("rejectedTxNumber").innerText = removeTrailingZeros(rejectedTxNumber);
    document.getElementById("averageInterval").innerText = removeTrailingZeros(averageInterval.toFixed(3));
    document.getElementById("maxInterval").innerText = removeTrailingZeros(maxInterval.toFixed(3));
    document.getElementById("timesinelastTx").innerText = removeTrailingZeros(timesinelastTx.toFixed(3));
    document.getElementById("lastMonthTxCount").innerText = removeTrailingZeros(lastMonthTxCount);
    document.getElementById("lastYearTxCount").innerText = removeTrailingZeros(lastYearTxCount);
    document.getElementById("averageTxInternal").innerText = removeTrailingZeros(averageTxInternal);
    const id1 = document.getElementById("id1");
    const id2 = document.getElementById("id2");

    if (totalspendAmount > 100) {
        id1.textContent = "Active User";
        id2.textContent = "This wallet has total spendings of more than $100";
        // 获取图像元素
        const imgElement = document.getElementById('id3');

        // 设置新的图片路径
        imgElement.src = 'https://uploads-ssl.webflow.com/65bc5c072835ea18c7eb3466/661f4a302d8c1fb0ae094790_2.png';
    }


    const dailyStats = await calculateDailyTransactions(address);

    // 准备数据
    const days = Object.keys(dailyStats);
    const transactionsData = Object.values(dailyStats).map(day => day.transactions);

    // 创建 Chart.js 实例
    const ctx = document.getElementById('myChart').getContext('2d');
    new Chart(ctx, {
        type: 'line', // 使用曲线图
        data: {
            labels: days, // 使用日期数组作为标签
            datasets: [
                {
                    data: transactionsData,
                    borderColor: 'blue',
                    fill: false, // 不填充区域
                },
            ],
        },
        options: {
            plugins: {
                legend: {
                    display: false // 不显示图例
                },
            },
            scales: {
                x: {
                    display: false, // 不显示横坐标
                },
                y: {
                    display: false, // 不显示纵坐标
                },
            },
            elements: {
                point: {
                    radius: 0 // 设置点的大小为0，即不显示点
                },
            },
            layout: {
                padding: {
                    top: 10,
                    bottom: 10,
                    left: 10,
                    right: 10
                }
            },
            responsive: true, // 允许响应式调整大小
            maintainAspectRatio: true // 不维持纵横比
        },
    });
})();






