# -----------------------------------------------------------------------------
# File: material_snippets.py
# Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
# Created On: 01-12-2025
# Description: Legacy hardcoded material snippets for subjects (deprecated, use database materials instead)
# -----------------------------------------------------------------------------

"""
Material snippets (notes) for different subjects.
Used to provide context to Gemini when answering student questions.
"""

MATERIAL_SNIPPETS = {
    "Accounting": [
        {
            "title": "Basics of Accounting",
            "page": 1,
            "keywords": ["accounting", "definition", "meaning", "what is", "basics"],
            "text": "Accounting is the process of identifying, recording, and communicating financial information about an organization. It involves three main activities: identifying economic events, recording them systematically, and communicating the results to interested parties."
        },
        {
            "title": "Double Entry System",
            "page": 5,
            "keywords": ["double entry", "debit", "credit", "ledger", "journal"],
            "text": "The double-entry system is the foundation of modern accounting. Every transaction affects at least two accounts: one account is debited and another is credited. The total debits must always equal total credits, ensuring the accounting equation (Assets = Liabilities + Equity) remains balanced."
        },
        {
            "title": "Financial Statements",
            "page": 12,
            "keywords": ["balance sheet", "income statement", "cash flow", "financial statements"],
            "text": "Financial statements include the Balance Sheet (shows assets, liabilities, and equity at a point in time), Income Statement (shows revenues and expenses over a period), and Cash Flow Statement (shows cash inflows and outflows). These provide a comprehensive view of a company's financial position and performance."
        }
    ],
    "DBMS": [
        {
            "title": "Normalization Overview",
            "page": 12,
            "keywords": ["1nf", "2nf", "3nf", "normalization", "normal form", "redundancy"],
            "text": "Normalization is a process in DBMS to reduce redundancy and dependency in database tables. First Normal Form (1NF) eliminates repeating groups, Second Normal Form (2NF) removes partial dependencies, and Third Normal Form (3NF) eliminates transitive dependencies. This improves data integrity and reduces storage space."
        },
        {
            "title": "SQL Basics",
            "page": 8,
            "keywords": ["sql", "select", "insert", "update", "delete", "query"],
            "text": "SQL (Structured Query Language) is used to manage relational databases. Key commands include SELECT (retrieve data), INSERT (add new records), UPDATE (modify existing records), and DELETE (remove records). SQL also supports JOIN operations to combine data from multiple tables."
        },
        {
            "title": "ACID Properties",
            "page": 25,
            "keywords": ["acid", "transaction", "atomicity", "consistency", "isolation", "durability"],
            "text": "ACID properties ensure reliable database transactions: Atomicity (all or nothing), Consistency (valid state transitions), Isolation (concurrent transactions don't interfere), and Durability (committed changes persist). These properties guarantee data integrity even in case of system failures."
        }
    ],
    "Database Management Systems (DBMS)": [
        {
            "title": "Normalization Overview",
            "page": 12,
            "keywords": ["1nf", "2nf", "3nf", "normalization", "normal form", "redundancy"],
            "text": "Normalization is a process in DBMS to reduce redundancy and dependency in database tables. First Normal Form (1NF) eliminates repeating groups, Second Normal Form (2NF) removes partial dependencies, and Third Normal Form (3NF) eliminates transitive dependencies. This improves data integrity and reduces storage space."
        },
        {
            "title": "SQL Basics",
            "page": 8,
            "keywords": ["sql", "select", "insert", "update", "delete", "query"],
            "text": "SQL (Structured Query Language) is used to manage relational databases. Key commands include SELECT (retrieve data), INSERT (add new records), UPDATE (modify existing records), and DELETE (remove records). SQL also supports JOIN operations to combine data from multiple tables."
        }
    ],
    "Operating Systems": [
        {
            "title": "Process Management",
            "page": 15,
            "keywords": ["process", "thread", "scheduling", "cpu", "multitasking"],
            "text": "Process management is a core function of operating systems. A process is a program in execution with its own memory space. The OS handles process creation, scheduling (determining which process runs when), synchronization, and termination. Process scheduling algorithms like Round Robin, FCFS, and Priority Scheduling optimize CPU utilization."
        },
        {
            "title": "Memory Management",
            "page": 22,
            "keywords": ["memory", "paging", "virtual memory", "segmentation", "ram"],
            "text": "Memory management involves allocating and deallocating memory to processes. Techniques include paging (dividing memory into fixed-size pages), segmentation (dividing into logical segments), and virtual memory (using disk space as an extension of RAM). This allows multiple processes to run efficiently with limited physical memory."
        }
    ],
    "Computer Networks": [
        {
            "title": "OSI Model",
            "page": 10,
            "keywords": ["osi", "tcp/ip", "protocol", "layer", "network"],
            "text": "The OSI (Open Systems Interconnection) model has 7 layers: Physical, Data Link, Network, Transport, Session, Presentation, and Application. Each layer has specific functions and protocols. The TCP/IP model is a simplified 4-layer version used in practice. Understanding these layers helps in network troubleshooting and design."
        },
        {
            "title": "IP Addressing",
            "page": 18,
            "keywords": ["ip address", "subnet", "ipv4", "ipv6", "network address"],
            "text": "IP addressing provides unique identification for devices on a network. IPv4 uses 32-bit addresses (e.g., 192.168.1.1), while IPv6 uses 128-bit addresses. Subnetting divides networks into smaller subnets for better organization and security. IP addresses are divided into network and host portions."
        }
    ],
    "Data Communication": [
        {
            "title": "Transmission Media",
            "page": 7,
            "keywords": ["transmission", "media", "cable", "fiber", "wireless"],
            "text": "Transmission media are the physical paths through which data travels. Guided media include twisted-pair cables, coaxial cables, and fiber-optic cables. Unguided media include radio waves, microwaves, and infrared. Each has different characteristics in terms of bandwidth, distance, and susceptibility to interference."
        }
    ],
    "Engineering Physics": [
        {
            "title": "Mechanics Fundamentals",
            "page": 3,
            "keywords": ["mechanics", "force", "motion", "newton", "kinematics"],
            "text": "Engineering mechanics deals with the behavior of physical bodies under forces. Newton's laws of motion form the foundation: First law (inertia), Second law (F=ma), and Third law (action-reaction). Kinematics studies motion without considering forces, while dynamics considers both motion and forces."
        }
    ],
    "Data Structures and Algorithms": [
        {
            "title": "Time Complexity",
            "page": 20,
            "keywords": ["complexity", "big o", "algorithm", "efficiency", "time"],
            "text": "Time complexity describes how the runtime of an algorithm grows with input size, expressed using Big O notation. Common complexities include O(1) constant, O(log n) logarithmic, O(n) linear, O(n log n) linearithmic, and O(n²) quadratic. Understanding complexity helps choose efficient algorithms for different problems."
        },
        {
            "title": "Common Data Structures",
            "page": 5,
            "keywords": ["array", "linked list", "stack", "queue", "tree", "data structure"],
            "text": "Common data structures include arrays (contiguous memory, O(1) access), linked lists (dynamic size, O(n) access), stacks (LIFO - Last In First Out), queues (FIFO - First In First Out), and trees (hierarchical data). Each has specific use cases based on required operations and efficiency needs."
        }
    ]
}
