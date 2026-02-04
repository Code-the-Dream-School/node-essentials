# Lesson/Assignment 5: SQL in Express

## About SQL

- A popular and in demand language
- back end developers need to know it
- critical for financial applications, etc.
- Not going away: NoSQL is not as good for some purposes
- Important in other domains: business, data analysis/presentation, etc.
- Accessible from all leading languages

## Data Normalization

SQL data is in tables.  Each row has values in a column that are primitive types: integer, float, string, etc.  Not objects, not arrays – can be blobs in some case, but not appropriate for JPEGs etc.

Typically one column is the primary key, usually an integer.  Other tables may reference this by using the value as a foreign key.

Associations 1-1, 1-Many, Many-Many

Often, data doesn’t start out normalized – you need to convert it into tables.

When designing an application, it’s a good idea to figure out the data model first, and build the code around it.

## Data Modelling Tools, e.g. LucidChart

![LucidChart Data Model](lucidchart.png)

## Other Concepts

Transactions

Isolation Levels

Schema Constraints

SQL implementations vary! You may need to change SQL when switching databases.  

## SQL verbs and syntax

W3Schools has a pretty good summary.

SELECT is for reading, but can by augmented by JOIN, GROUP BY, aggregation with SUM, AVG, etc, and WHERE conditions.  
INSERT/UPDATE/DELETE for other CRUD operations.  
CREATE/DROP for databases.  
CREATE/ALTER/DROP for tables.  
This class doesn’t cover everything – read the reference at W3schools or elsewhere.  
Access control: protected by ID and password. May be local or network access.  
Schema constraints should be augmented with data validation and sanitization.  

## Postgresql, Node, and SQL

You can use the PG package to make SQL calls from Node.

The app has one pool of connections.  You don’t want to have to create a connection per request. It handles network connectivity and SSL for remote DBs.

Single operations: pass to the pool, a connection within the pool will perform the operation.

Transactions: check a connection out of the pool, Begin, do a sequence of reads and writes, commit or rollback, and return the connection to the pool. Errors may be thrown.

Close the pool when the app comes down.

## On Merge Conflicts

You may see merge conflicts in this class, especially for package.json, because updates from the upstream repository may change that file.

Edit package.json, choose the lines you want, run npm install, add and commit to complete the merge.

Of course merge conflicts happen in team projects too.

## NPM Reported Security Vulnerabilities

NPM may report a vulnerability in one of your packages.

Do you care? Probably not for development packages, maybe not for low severity ones, probably not if not deploying to the internet.  In other cases, yes!

npm audit fix can introduce breaking changes.  Use with judgement.

How to understand the risks:
- The github report
- The CVE, if any

## Example of Recent Vulnerability

```
# npm audit report
mongoose  <=6.13.5
Severity: critical
Mongoose search injection vulnerability - https://github.com/advisories/GHSA-m7xq-9374-9rvx
Mongoose search injection vulnerability - https://github.com/advisories/GHSA-vg7j-7cwx-8wgw
fix available via `npm audit fix --force`
Will install mongoose@9.0.1, which is a breaking change
node_modules/mongoose
```
