# snap-stats

- Download your snapchat data on [accounts.snapchat.com](https://accounts.snapchat.com)
![2018-06-23-223314_1920x1080_scrot](https://user-images.githubusercontent.com/9092290/41813454-10120c84-7737-11e8-8c3a-ea52bf309f3b.png)
- `unzip mydata_XXXXXXXXXXXXX.zip -d mydata`
- `yarn install`
- `node snap_stats.js mydata/json`
- open generated file index.html
![2018-06-24-171435_1920x1080_scrot](https://user-images.githubusercontent.com/9092290/41820628-1a2feef4-77d5-11e8-991b-985b169c509f.png)

Note that Snapchat seems to only save the data of the 30 last days.
Furthermore, snaps and messages are deleted when opened so all you
get is a json that looks like this:

```json
{
   "Received Snap History": [
      {
         "From": "user1",
         "Media Type": "IMAGE",
         "Created": "2018-08-09 14:40:38 UTC"
      },
      {
         "From": "user2",
         "Media Type": "IMAGE",
         "Created": "2018-08-09 14:40:14 UTC"
      }
   ],
   "Sent Snap History": [
      {
         "To": "user1",
         "Media Type": "IMAGE",
         "Created": "2018-08-09 14:45:43 UTC"
      },
      {
         "To": "user2",
         "Media Type": "IMAGE",
         "Created": "2018-08-09 14:45:27 UTC"
      }
   ]
}
```
