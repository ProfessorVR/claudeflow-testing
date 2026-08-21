import csv

CSV = '/home/dalton/projects/claudeflow-testing/tmp/Dissertation/Part_III/survey-analysis/data/open_text.csv'

checks = [
    ("S25-R033","Q6","my laptop sounded like it was about to blow up after 5 minutes"),
    ("S25-R033","Q6","I think the VR program needs more tweaking, especially to work on a less powerful computer, because, at least for me,"),
    ("S25-R034","Q6","The VR platform is too cumbersome to get working on your computer, most students just resort to the online videos"),
    ("W26-R023","Q9","the platform was extremely slow in terms of accessing the videos and interviews, which eventually became frustrating and led to watching the Youtube videos"),
    ("W26-R007","Q6","I preferred the YouTube channel for virtual reality, over the app. I'm not a video game fan, maybe is that"),
    ("W26-R047","Q9","Maybe not having the place in the game just directly clickable links to open the videos. It was weird having to walk around just to find the right video"),
    ("W26-R007","Q5","I loved the VR videos; I feel that it actually made me feel like an engineer trying to find and solve problems that real doctors are facing"),
    ("S25-R028","Q5","It was different for each place and being able to make it seem like we were in the procedure and watching made it more immersive rather than boring"),
    ("S25-R039","Q6","the vr learning platform wasn't accessible, and i think if youtube videos do the job, they do the job. some things don't need to be improved on; take the paperclip for example"),
    ("W26-R055","Q10","I do not think this one should ever be mandated in the future. It should be an extra option. I cannot imagine a time when a VR space would be more helpful"),
    ("W26-R024","Q9","The VR clinical immersion lobby is modelled poorly and it reminds me of a children's game. I didn't find it to be very academic? The initial impression really turned me off of using it and the actual videos were disorienting"),
    ("W26-R059","Q10","There is no difference between virtually moving through a museum and seeing photos with text underneath for the purposes of learning"),
    ("W26-R059","Q10","Unless the virtual environment can provide an experience that is unable to be achieved without it, and allows for learning that is done at one's own pace and with elements that rely on the immersion potential and interactivity, then there is no purpose in using it over other alternatives"),
    ("S25-R048","Q5","I found the online course format very useful--especially the VR classroom space. I thought it was really cool to navigate, and helped compartmentalize individual findings"),
    ("W26-R036","Q6","They reached out to me in order to begin the group project, and I responded, and I was ghosted until the final few weeks of the quarter where I found myself very behind in the group's work with no knowledge that they were organizing without me"),
    ("W26-R001","Q10","I think a virtual group will be nice, students could make their own charactors, students who don't know each other may shy to speak in reality, but if there is a virtual image for them, they might have less stress talking to others"),
    ("S25-R002","Q10","group communications that do not wish to do video camera meetings"),
    ("S25-R074","Q10","some of us don't wanna have their cameras on"),
    ("S25-R059","Q9","Provide a cloud version of the VR. Meaning, provide the VR setup and ready to go on a cloud machine provided by UCI. This will help for inclusivity in the VR"),
    ("W26-R016","Q9","I think there should be reflections in the VR environment. While being immersed in the procedure is fascinating, having reflections afterwards would allow us to look for the main takeaways from these procedures and allow us to think critically about clinical needs"),
    ("S25-R017","Q6","The long videos of the procedures in the VR could probably be improved. I didn't really understand what was going on, and the videos felt too long. If they were split into multiple parts it would probably be easier to focus on the procedure"),
    ("S25-R037","Q6","I think a good think would be to assign certain VR on video to watch weekly so that all members could stay on track. because the main issues was people were just waiting too last minute to watch the videos"),
    ("W26-R059","Q6","complete freedom often will lead to procrastination"),
]

rows = {}
with open(CSV, newline='') as f:
    for r in csv.DictReader(f):
        rows[(r['rcode'], r['item'])] = r['text']

fails = 0
for rcode, item, span in checks:
    text = rows.get((rcode, item))
    if text is None:
        print(f"MISSING ROW  {rcode}/{item}")
        fails += 1
    elif span in text:
        print(f"OK           {rcode}/{item}  [{span[:40]}...]")
    else:
        print(f"MISMATCH     {rcode}/{item}  [{span[:60]}...]")
        print(f"  CSV TEXT:  {text[:200]}")
        fails += 1
print(f"\n{len(checks)-fails}/{len(checks)} verified")
