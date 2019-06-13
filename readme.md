# inventory

a simple implementation of a distributed lending library

please note, this is a "app sketch" of sorts

# todo

debug, write backend, put some mock data in there

# design

app side: angular with nativescript, shared app and web services / templates where applicable

backend: node based microservices, Eth for contracts, document store or postgres whichever is more appropriate

# Q & A

## commerce

inventory is not supposed to be a for profit platform. inventory is meant to help people obtain things they need to live well without breaking their respective banks.

### ok noble, but how does it support itself?

inventory charges double the cost of shipping to request an item, and if you are ok with never seeing something again, you can set a buy out price. Once the request is confirmed by the user, inventory prints a shipping label for the owner of the item in question, the other half, the duplicate cost of shipping is held in a safe investment portfolio and is released in the following scenarios:

- the item is returned, in which case the hold will be used for return shipping 
- the item is requested by another user, and the current holder confirms this, the hold will be used to pay for forward shipping, and any delta returned
- the item is bought, in which case the hold will be used to purchase the item

once inventory takes off, should that savings account start to yield enough money to support the business with a surplus, we can start to offer small, items in circulation based dividends to users who have non-rent based items up for grabs, creating an incentive beyond simple good nature :)

### alright, but what about shipping labels

smart post will be used initially to be supplemented by other third parties if inventory takes off

### ok fine, sounds good so far, how will i know someone will honor their contract?

you uh, won't? inventory will use smart contracts to ensure cryptographically secure digitally signable agreements.

### sure, yeah, smart contracts, but what if i want to check in on my item (like expensive hardware etc)

currently the plan is to use Ethereum, which is a deeply extensible platform. the thinking goes, that if we want to extend the contract somehow, like with a motion tracker to ensure use, or a user confirmed picture mechanism, we will use that.

### that actually sort of sounds a little sketchy, like kidnapping for physical goods

yeah, the ethics of using motion trackers or picture confirmation systems is a little weird, i for one will likely only use the normal contract mechanism, but to each their own.

### ok, lets say i accept the above, what does this service really get me?

lets say you want a nice purse for a ball, or a mixing board for an upcoming show, or anything else out of your means currently - inventory would allow you to obtain those things without making a full purchase, with the knowledge others will also be able to do so in the future.

or!

lets say you have something you're not using, you can share that thing with others, with some knowledge 

### whoa fine, that sounds cool, but what if someone just steals my shit??

report them! they will be given a certain amount of time to return the item, or buy it if the owner set that as an option. if they continue to not return stuff, they'll be suspended, and eventually banned if deemed melicious.

### sounds good, what's to stop people from creating a ton of accounts?

the same cyber sec that other commerce companies use, and the knowledge that shipping times 2 isn't lucrative for most items people are willing to share.

### i see where you're going i guess, what about bigger items? like if i have a table that's older and in storage, but want to share it, it would be cheaper to just tell them to buy a used one somewhere?

oh yeah, so one shipping type is user pickup, which will use average fuel price as the hold, but since they have to drive their and back, the hold is:

- road distance * 2 * max price of fuel * avg truck mpg from the last 30 years

### how do i know if a user is legit?

everyone starts in good graces, no impossible sales gambit to reach 100% or DIAMOND!?!?!?!, mostly just please don't steal, and if you do, the system will automagically deal with you

for review:
- shipping * 2, half is used for return shipping
- buy out price
- suspension / expulsion

### sounds ok, but there seems to be a lot of legal eagle stuff you're missing

yeah, i know, note the note at the top, this is an app sketch, not the real thing!

### should you be able to request a return?

maybe with a refund of the shipping, and possible limits? idk i'll think about that. the idea of the service is ideally
 not lend anything you would need in short order, just items you would otherwise keep in storage or that go largely unused.